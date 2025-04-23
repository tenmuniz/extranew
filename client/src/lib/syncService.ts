import { queryClient } from '@/lib/queryClient';
import { getWebSocketUrl } from '@/lib/websocketUtils';

type WebSocketMessage = {
  type: string;
  payload: any;
};

class SyncService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private isConnecting = false;

  constructor() {
    this.connect();
    // Adicionar event listener para reconectar quando a janela voltar a ficar visível
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected()) {
        this.connect();
      }
    });
  }

  // Verificar se o WebSocket está conectado
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Conectar ao servidor WebSocket
  connect(): void {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = getWebSocketUrl('/ws');
    console.log(`Conectando ao WebSocket: ${wsUrl}`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket conectado com sucesso');
        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.cancelReconnect();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erro processando mensagem WebSocket:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket desconectado');
        this.socket = null;
        this.isConnecting = false;
        
        // Tentar reconectar se ainda não atingiu o número máximo de tentativas
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Falha ao inicializar WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Agendar reconexão
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    
    this.connectionAttempts++;
    const delay = Math.min(5000 * this.connectionAttempts, 30000); // Aumentar o intervalo até 30s
    
    console.log(`Agendando reconexão em ${delay}ms (tentativa ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  // Cancelar reconexão agendada
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Processar mensagens recebidas do servidor
  private handleMessage(message: WebSocketMessage): void {
    console.log('Mensagem WebSocket recebida:', message.type);
    
    switch (message.type) {
      case 'INITIAL_DATA':
        // Atualizar cache do React Query com os dados recebidos
        if (message.payload.personnel) {
          queryClient.setQueryData(['/api/personnel'], message.payload.personnel);
        }
        if (message.payload.assignments) {
          queryClient.setQueryData(['/api/assignments'], message.payload.assignments);
        }
        break;
        
      case 'PERSONNEL_UPDATED':
        // Atualizar apenas o cache de pessoal
        if (message.payload.personnel) {
          queryClient.setQueryData(['/api/personnel'], message.payload.personnel);
        }
        break;
        
      case 'DATA_UPDATED':
        // Atualizar ambos os caches (pessoal e atribuições)
        if (message.payload.personnel) {
          queryClient.setQueryData(['/api/personnel'], message.payload.personnel);
        }
        if (message.payload.assignments) {
          queryClient.setQueryData(['/api/assignments'], message.payload.assignments);
        }
        break;
        
      default:
        console.log('Tipo de mensagem WebSocket desconhecido:', message.type);
    }
  }

  // Solicitar atualização de dados
  requestRefresh(): void {
    if (!this.isConnected()) {
      this.connect();
      return;
    }
    
    try {
      this.socket?.send(JSON.stringify({
        type: 'REQUEST_REFRESH'
      }));
    } catch (error) {
      console.error('Erro ao solicitar atualização:', error);
    }
  }

  // Fechar conexão quando não for mais necessária
  disconnect(): void {
    this.cancelReconnect();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Criar uma instância única do serviço
const syncService = new SyncService();

export default syncService;