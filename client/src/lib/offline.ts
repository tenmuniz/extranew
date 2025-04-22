// Biblioteca para suporte offline do Sistema de Escalas 20ª CIPM

import { queryClient } from "./queryClient";
import { Personnel, Assignment } from "@shared/schema";

// Constantes do banco de dados
const DB_NAME = 'escalas-20cipm-db';
const DB_VERSION = 1;
const STORE_PERSONNEL = 'personnel';
const STORE_ASSIGNMENTS = 'assignments';
const STORE_PENDING_ACTIONS = 'pending-actions';

// Interface para ações pendentes
interface PendingAction {
  id?: number;
  type: string;
  data: any;
  timestamp: number;
}

// Abrir o banco de dados IndexedDB
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar stores para dados se não existirem
      if (!db.objectStoreNames.contains(STORE_PERSONNEL)) {
        db.createObjectStore(STORE_PERSONNEL, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_ASSIGNMENTS)) {
        db.createObjectStore(STORE_ASSIGNMENTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_PENDING_ACTIONS)) {
        db.createObjectStore(STORE_PENDING_ACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
}

// Sincronizar dados com o banco de dados IndexedDB
export async function syncData(): Promise<void> {
  try {
    // Tentar buscar os dados atuais da API
    const personnel = await queryClient.fetchQuery({ 
      queryKey: ['/api/personnel'],
      queryFn: async () => {
        const response = await fetch('/api/personnel');
        if (!response.ok) throw new Error('Failed to fetch personnel');
        return await response.json() as Personnel[];
      }
    });
    
    const assignments = await queryClient.fetchQuery({ 
      queryKey: ['/api/assignments'],
      queryFn: async () => {
        const response = await fetch('/api/assignments');
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return await response.json() as Assignment[];
      }
    });
    
    // Armazenar os dados no IndexedDB
    const db = await openDB();
    const tx = db.transaction([STORE_PERSONNEL, STORE_ASSIGNMENTS], 'readwrite');
    
    // Limpar e armazenar dados de pessoal
    const personnelStore = tx.objectStore(STORE_PERSONNEL);
    await clearStore(personnelStore);
    for (const person of personnel) {
      personnelStore.put(person);
    }
    
    // Limpar e armazenar dados de atribuições
    const assignmentsStore = tx.objectStore(STORE_ASSIGNMENTS);
    await clearStore(assignmentsStore);
    for (const assignment of assignments) {
      assignmentsStore.put(assignment);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('Dados sincronizados com sucesso para uso offline');
        resolve();
      };
      
      tx.onerror = () => {
        console.error('Erro ao sincronizar dados:', tx.error);
        reject(tx.error);
      };
    });
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    throw error;
  }
}

// Limpar um objectStore
function clearStore(store: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Adicionar uma ação pendente para sincronização futura
export async function addPendingAction(type: string, data: any): Promise<number> {
  const action: PendingAction = {
    type,
    data,
    timestamp: Date.now()
  };
  
  const db = await openDB();
  const tx = db.transaction([STORE_PENDING_ACTIONS], 'readwrite');
  const store = tx.objectStore(STORE_PENDING_ACTIONS);
  
  return new Promise((resolve, reject) => {
    const request = store.add(action);
    
    request.onsuccess = () => {
      resolve(request.result as number);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Obter dados do pessoal do armazenamento offline
export async function getOfflinePersonnel(): Promise<Personnel[]> {
  const db = await openDB();
  const tx = db.transaction([STORE_PERSONNEL], 'readonly');
  const store = tx.objectStore(STORE_PERSONNEL);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Obter dados de atribuições do armazenamento offline
export async function getOfflineAssignments(): Promise<Assignment[]> {
  const db = await openDB();
  const tx = db.transaction([STORE_ASSIGNMENTS], 'readonly');
  const store = tx.objectStore(STORE_ASSIGNMENTS);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Sincronizar alterações pendentes com o servidor
export async function syncPendingActions(): Promise<boolean> {
  if (!navigator.onLine) {
    console.log('Não é possível sincronizar enquanto estiver offline');
    return false;
  }
  
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_PENDING_ACTIONS], 'readwrite');
    const store = tx.objectStore(STORE_PENDING_ACTIONS);
    
    // Obter todas as ações pendentes
    const pendingActions = await new Promise<PendingAction[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (pendingActions.length === 0) {
      console.log('Nenhuma ação pendente para sincronizar');
      return true;
    }
    
    // Enviar ações pendentes para o servidor
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pendingChanges: pendingActions })
    });
    
    if (!response.ok) {
      throw new Error(`Falha ao sincronizar: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Remover ações que foram sincronizadas com sucesso
    const successfulIds = result.results
      .filter((r: any) => r.success)
      .map((r: any) => r.id);
    
    // Remover as ações sincronizadas do banco de dados
    for (const id of successfulIds) {
      if (id) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }
    
    // Recarregar os dados atualizados
    await syncData();
    
    // Invalidar o cache React Query para refletir as mudanças
    queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
    queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar ações pendentes:', error);
    return false;
  }
}

// Verificar se existem ações pendentes
export async function hasPendingActions(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_PENDING_ACTIONS], 'readonly');
    const store = tx.objectStore(STORE_PENDING_ACTIONS);
    
    return new Promise((resolve, reject) => {
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        resolve(countRequest.result > 0);
      };
      countRequest.onerror = () => {
        reject(countRequest.error);
      };
    });
  } catch (error) {
    console.error('Erro ao verificar ações pendentes:', error);
    return false;
  }
}

// Interceptar e redirecionar chamadas de API quando estiver offline
export function setupOfflineInterceptor() {
  // Salvar a referência original da função fetch
  const originalFetch = window.fetch;
  
  // Substituir a função fetch por nossa implementação
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : 
                input instanceof Request ? input.url : 
                input.toString();
    const method = init?.method || 'GET';
    
    // Se estiver online, tente fazer a requisição normal
    if (navigator.onLine) {
      try {
        const response = await originalFetch(input, init);
        return response;
      } catch (error) {
        console.error('Erro ao fazer fetch online:', error);
        // Se falhar, tente usar os dados offline
      }
    }
    
    // Se estiver offline ou a requisição online falhou
    console.log('Offline - usando dados do IndexedDB para:', url);
    
    // REQUISIÇÕES GET
    if (method === 'GET') {
      // Requisição para listar pessoal
      if (url.includes('/api/personnel')) {
        try {
          const personnel = await getOfflinePersonnel();
          return new Response(JSON.stringify(personnel), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Erro ao obter dados offline de pessoal:', error);
        }
      }
      
      // Requisição para listar atribuições
      else if (url.includes('/api/assignments')) {
        try {
          const assignments = await getOfflineAssignments();
          return new Response(JSON.stringify(assignments), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Erro ao obter dados offline de atribuições:', error);
        }
      }
      
      // Requisição para verificar status do servidor
      else if (url.includes('/api/health')) {
        return new Response(JSON.stringify({ 
          status: 'offline',
          timestamp: new Date().toISOString(),
          message: 'Aplicativo está funcionando no modo offline'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // REQUISIÇÕES POST, PUT, DELETE
    else {
      // Se for uma operação de mutação, adicione à fila de ações pendentes
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        try {
          let type = '';
          let data = {};
          
          // Analisar o corpo da requisição
          if (init?.body) {
            try {
              data = JSON.parse(init.body.toString());
            } catch (e) {
              console.error('Erro ao analisar o corpo da requisição:', e);
            }
          }
          
          // Determinar o tipo de ação com base na URL e método
          if (url.includes('/api/personnel')) {
            if (method === 'POST') type = 'create_personnel';
            else if (method === 'PUT') type = 'update_personnel';
            else if (method === 'DELETE') type = 'delete_personnel';
          }
          else if (url.includes('/api/assignments')) {
            if (method === 'POST') type = 'create_assignment';
            else if (method === 'DELETE') type = 'delete_assignment';
          }
          
          // Adicionar à fila de ações pendentes
          if (type) {
            const actionId = await addPendingAction(type, data);
            
            // Resposta simulada para manter a UI funcionando
            return new Response(JSON.stringify({ 
              id: actionId,
              ...data,
              _offline: true
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          console.error('Erro ao processar ação offline:', error);
        }
      }
    }
    
    // Resposta padrão de erro
    return new Response(JSON.stringify({ 
      error: 'Não foi possível processar essa solicitação offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

// Inicializar suporte offline
export async function initOfflineSupport() {
  try {
    // Tentar sincronizar dados imediatamente
    if (navigator.onLine) {
      await syncData();
    }
    
    // Configurar interceptor para quando ficar offline
    setupOfflineInterceptor();
    
    // Tentar sincronizar novamente quando ficar online
    window.addEventListener('online', async () => {
      console.log('Conexão online detectada - sincronizando dados');
      try {
        await syncPendingActions();
        await syncData();
      } catch (error) {
        console.error('Erro ao sincronizar após ficar online:', error);
      }
    });
    
    console.log('Suporte offline inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar suporte offline:', error);
    return false;
  }
}