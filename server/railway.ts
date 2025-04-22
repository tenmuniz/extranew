/**
 * Módulo específico para configurações do Railway
 * 
 * Este arquivo contém funções auxiliares para o ambiente Railway,
 * garantindo que a aplicação funcione corretamente em produção.
 */

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
    }
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
    const { db } = await import('./db');
    
    if (!db) {
      console.error('Módulo de banco de dados não inicializado corretamente.');
      return false;
    }
    
    // Tentar executar uma consulta simples
    const result = await db.execute('SELECT 1 as check');
    
    if (result) {
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar conexão com o banco de dados:', error);
    return false;
  }
}

/**
 * Configura handlers para erro e sinais do sistema
 * para garantir um desligamento gracioso no Railway
 */
export function setupGracefulShutdown(server: any): void {
  // Handler para SIGTERM (sinal enviado pelo Railway para shutdown)
  process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, iniciando desligamento gracioso...');
    
    if (server && server.close) {
      server.close(() => {
        console.log('Servidor HTTP fechado com sucesso.');
        process.exit(0);
      });
    } else {
      console.log('Servidor não disponível para fechamento.');
      process.exit(0);
    }
    
    // Forçar saída após 10 segundos se o servidor não fechar
    setTimeout(() => {
      console.log('Shutdown forçado após timeout.');
      process.exit(1);
    }, 10000);
  });
  
  // Handler para erros não tratados
  process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
    // Não forçar encerramento, apenas registrar
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promessa rejeitada não tratada:', reason);
    // Não forçar encerramento, apenas registrar
  });
}