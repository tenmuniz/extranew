// Arquivo de inicialização específico para o deploy

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Obter o diretório atual do script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para inicializar o banco de dados durante o deploy
export async function initializeDeployDatabase() {
  console.log('[Deploy] Iniciando processo de deploy do banco de dados...');
  
  // Definir NODE_ENV como produção se não estiver definido
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  // Verificar se temos arquivo .env.production e carregá-lo
  const envPath = path.resolve(__dirname, '..', '.env.production');
  if (fs.existsSync(envPath)) {
    console.log(`[Deploy] Carregando variáveis de ambiente de ${envPath}`);
    try {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      console.log('[Deploy] Variáveis de ambiente carregadas com sucesso');
    } catch (error) {
      console.error('[Deploy] Erro ao carregar variáveis de ambiente:', error);
    }
  } else {
    console.log('[Deploy] Arquivo .env.production não encontrado, usando variáveis existentes');
  }
  
  // Verificar variáveis críticas
  if (!process.env.DATABASE_URL) {
    if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
      // Construir DATABASE_URL a partir das variáveis individuais
      const host = process.env.PGHOST;
      const user = process.env.PGUSER;
      const password = process.env.PGPASSWORD;
      const database = process.env.PGDATABASE;
      const port = process.env.PGPORT || '5432';
      
      process.env.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
      console.log(`[Deploy] DATABASE_URL construída: postgres://${user}:***@${host}:${port}/${database}`);
    } else {
      console.warn('[Deploy] DATABASE_URL não definida e variáveis individuais insuficientes!');
      // Tente valores padrão para o Replit
      process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
      console.log('[Deploy] Tentando usar conexão padrão local do Replit');
    }
  } else {
    console.log('[Deploy] DATABASE_URL já está definida');
  }
  
  // Exibir mensagem de status
  console.log('[Deploy] Configuração para deploy concluída');
  
  return true;
}

// Executar a função se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDeployDatabase()
    .then(() => {
      console.log('[Deploy] Inicialização de deploy concluída com sucesso');
      process.exit(0);
    })
    .catch(error => {
      console.error('[Deploy] Falha na inicialização de deploy:', error);
      process.exit(1);
    });
}