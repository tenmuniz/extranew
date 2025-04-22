/**
 * Módulo específico para configurações do Railway
 * 
 * Este arquivo contém funções auxiliares para o ambiente Railway,
 * garantindo que a aplicação funcione corretamente em produção.
 */

// Configurar timeout para operações críticas (em ms)
const SERVER_SHUTDOWN_TIMEOUT = parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || '15000', 10);
const DB_OPERATION_TIMEOUT = parseInt(process.env.DB_OPERATION_TIMEOUT || '5000', 10);

/**
 * Configura todas as variáveis de ambiente necessárias para o Railway
 */
export function setupRailwayEnvironment(): void {
  // Verificar se estamos no Railway
  const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
  
  if (isRailway) {
    console.log(`Executando no ambiente Railway: ${process.env.RAILWAY_ENVIRONMENT}`);
    
    // Garantir que PORT esteja configurada
    if (!process.env.PORT) {
      process.env.PORT = "3000";
      console.log(`PORT configurada para valor padrão: ${process.env.PORT}`);
    }
    
    // Configurar NODE_ENV para production se não estiver definido
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = "production";
      console.log(`NODE_ENV configurado para: ${process.env.NODE_ENV}`);
    }
    
    // Verificar DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.warn('AVISO: DATABASE_URL não está configurada. A aplicação usará armazenamento em memória.');
    } else {
      console.log('DATABASE_URL configurada corretamente.');
      
      // Registrar versão do Node.js e outras informações do sistema
      const nodeVersion = process.version;
      const platform = process.platform;
      const memoryUsage = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
      
      console.log(`Informações do sistema: Node.js ${nodeVersion}, ${platform}, Memória: ${memoryUsage}MB`);
    }
    
    // Configurar timeouts e outros parâmetros de segurança
    console.log(`Timeout para shutdown do servidor: ${SERVER_SHUTDOWN_TIMEOUT}ms`);
    console.log(`Timeout para operações de banco de dados: ${DB_OPERATION_TIMEOUT}ms`);
  } else {
    console.log('Executando em ambiente de desenvolvimento local.');
  }
}

/**
 * Verifica se o banco de dados está disponível
 * @returns Promise<boolean> indicando se o banco está disponível
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL não configurada, pulando verificação de conexão.');
    return false;
  }
  
  try {
    // Importar o módulo de banco de dados
    const { db, pool } = await import('./db');
    
    if (!db) {
      console.error('Módulo de banco de dados não inicializado corretamente.');
      return false;
    }
    
    console.log('Tentando conectar ao banco de dados...');
    
    // Criar uma promise com timeout
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout após ${DB_OPERATION_TIMEOUT}ms`)), DB_OPERATION_TIMEOUT);
    });
    
    // Tentar executar uma consulta simples
    const queryPromise = db.execute('SELECT 1 as check').then(result => {
      if (result) {
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
        return true;
      }
      return false;
    });
    
    // Usar Promise.race para implementar timeout
    return await Promise.race([queryPromise, timeoutPromise]) as boolean;
  } catch (error) {
    console.error('Erro ao verificar conexão com o banco de dados:', error);
    
    // Tentar diagnóstico adicional
    try {
      console.log('Detalhes da conexão (mascarados):');
      const dbUrlParts = process.env.DATABASE_URL?.split('@');
      if (dbUrlParts && dbUrlParts.length > 1) {
        console.log(`Host: ${dbUrlParts[1].split('/')[0]}`);
      }
    } catch (e) {
      console.log('Não foi possível analisar a URL do banco de dados para diagnóstico');
    }
    
    return false;
  }
}

/**
 * Configura handlers para erro e sinais do sistema
 * para garantir um desligamento gracioso no Railway
 */
export function setupGracefulShutdown(server: any): void {
  let isShuttingDown = false;
  
  // Função comum para iniciar o processo de shutdown
  const initiateShutdown = (signal: string) => {
    // Evitar múltiplas chamadas de shutdown
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`${signal} recebido, iniciando desligamento gracioso...`);
    
    // Função para encerrar recursos
    const shutdownServer = () => {
      if (server && server.close) {
        // Fechar o servidor HTTP
        server.close(() => {
          console.log('Servidor HTTP fechado com sucesso.');
          
          // Fechar conexões com o banco de dados
          try {
            const { pool } = require('./db');
            if (pool && typeof pool.end === 'function') {
              console.log('Fechando conexões com o banco de dados...');
              pool.end().then(() => {
                console.log('Conexões com o banco de dados fechadas.');
                process.exit(0);
              }).catch((err: Error) => {
                console.error('Erro ao fechar conexões com o banco:', err);
                process.exit(1);
              });
            } else {
              console.log('Pool de banco de dados não disponível ou já fechado.');
              process.exit(0);
            }
          } catch (err) {
            console.log('Erro ao importar módulo de banco de dados:', err);
            process.exit(0);
          }
        });
      } else {
        console.log('Servidor não disponível para fechamento.');
        process.exit(0);
      }
    };
    
    // Iniciar o processo de shutdown
    shutdownServer();
    
    // Forçar saída após o timeout se o servidor não fechar
    setTimeout(() => {
      console.log(`Shutdown forçado após timeout de ${SERVER_SHUTDOWN_TIMEOUT}ms.`);
      process.exit(1);
    }, SERVER_SHUTDOWN_TIMEOUT);
  };
  
  // Handler para SIGTERM (sinal enviado pelo Railway para shutdown)
  process.on('SIGTERM', () => initiateShutdown('SIGTERM'));
  
  // Handler para SIGINT (Ctrl+C em ambiente de desenvolvimento)
  process.on('SIGINT', () => initiateShutdown('SIGINT'));
  
  // Handler para SIGQUIT
  process.on('SIGQUIT', () => initiateShutdown('SIGQUIT'));
  
  // Handler para erros não tratados
  process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
    // Em produção, erros não tratados graves podem justificar um reinício
    if (process.env.NODE_ENV === 'production') {
      console.error('Erro crítico não tratado em produção, iniciando shutdown...');
      initiateShutdown('uncaughtException');
    }
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa rejeitada não tratada:', reason);
    // Em produção, podemos apenas registrar, sem forçar encerramento
  });
  
  // Registro do processo de inicialização
  console.log(`Handlers de shutdown configurados com timeout de ${SERVER_SHUTDOWN_TIMEOUT}ms`);
}