import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Verifica o ambiente atual
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

console.log(`[DB] Ambiente atual: ${process.env.NODE_ENV || 'não definido'}`);

// Configuração para WebSockets do Neon Database
neonConfig.webSocketConstructor = ws;

// Verifica se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error("AVISO: DATABASE_URL não está definida. Tentando usar variáveis individuais do PostgreSQL");
  
  // Tenta construir a URL a partir das variáveis individuais
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    const host = process.env.PGHOST;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const database = process.env.PGDATABASE;
    const port = process.env.PGPORT || '5432';
    
    process.env.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
    console.log(`[DB] DATABASE_URL construída a partir de variáveis individuais: postgres://${user}:***@${host}:${port}/${database}`);
  } else {
    throw new Error(
      "DATABASE_URL não está definida e as variáveis individuais do PostgreSQL estão incompletas.",
    );
  }
}

// Configurações de conexão para diferentes ambientes
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 10 : 20,           // Menos conexões em produção
  idleTimeoutMillis: 30000,              // Tempo de expiração de conexões inativas
  connectionTimeoutMillis: 10000,        // Tempo limite maior para novas conexões em produção
  allowExitOnIdle: false,                // Não permitir saída quando inativo
};

// Cria pool com opções de conexão robustas
export const pool = new Pool(poolConfig);

// Configurar listeners para o pool de conexões
pool.on('error', (err) => {
  console.error('[DB] Pool de conexão PostgreSQL encontrou um erro:', err);
  
  // Reconectar após um tempo em caso de erro em produção
  if (isProduction) {
    console.log('[DB] Tentando reconectar em 5 segundos...');
    setTimeout(() => {
      console.log('[DB] Reconectando...');
      const client = pool.connect();
      client.then(c => {
        console.log('[DB] Reconexão bem-sucedida');
        c.release();
      }).catch(err => {
        console.error('[DB] Falha na reconexão:', err);
      });
    }, 5000);
  }
});

pool.on('connect', () => {
  console.log('[DB] Nova conexão PostgreSQL estabelecida');
});

// Função auxiliar para testar a conexão
export async function testConnection() {
  console.log('[DB] Testando conexão com o banco de dados...');
  try {
    const client = await pool.connect();
    console.log('[DB] Conexão com o banco de dados bem-sucedida');
    client.release();
    return true;
  } catch (error) {
    console.error('[DB] Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Instancia o cliente drizzle com tratamento de erros melhorado
export const db = drizzle(pool, { 
  schema,
  logger: isDevelopment
});