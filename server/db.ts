import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Nota: Trocamos de @neondatabase/serverless para pg padrão
// Evitando a dependência de WebSocket que estava causando problemas no deploy

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
console.log(`[DB] Ambiente atual: ${process.env.NODE_ENV || 'não definido'}`);

// Verificar disponibilidade de variáveis de ambiente
if (!process.env.DATABASE_URL) {
  console.warn("[DB] DATABASE_URL não definida. Tentando construir a partir das variáveis individuais.");
  
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    const host = process.env.PGHOST;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const database = process.env.PGDATABASE;
    const port = process.env.PGPORT || '5432';
    
    process.env.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
    console.log(`[DB] DATABASE_URL construída: postgres://${user}:***@${host}:${port}/${database}`);
  } else {
    // Em vez de falhar completamente, vamos tentar localizar o banco no ambiente de produção
    console.error("[DB] Variáveis PGHOST, PGUSER, etc. não encontradas.");
    
    if (isProduction) {
      // No Replit, o PostgreSQL geralmente está disponível em localhost
      console.log("[DB] Tentando conectar ao PostgreSQL local no ambiente de produção...");
      
      // Nome do banco padrão (geralmente postgres ou o nome do projeto)
      const defaultDb = process.env.REPL_SLUG || "postgres";
      
      // Construir URL de conexão no formato postgres://user:password@host:port/dbname
      process.env.DATABASE_URL = `postgres://postgres:postgres@localhost:5432/${defaultDb}`;
      
      console.log(`[DB] Tentando URL: postgres://postgres:***@localhost:5432/${defaultDb}`);
    } else {
      throw new Error("[DB] Não foi possível encontrar as variáveis de ambiente do PostgreSQL");
    }
  }
}

// Configurações do pool de conexões
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Número máximo de conexões no pool
  idleTimeoutMillis: 30000,     // Tempo em ms antes de encerrar conexões inativas
  connectionTimeoutMillis: 5000, // Tempo máximo de espera para novas conexões
  allowExitOnIdle: false,       // Não permitir que o processo saia quando o pool estiver ocioso
  ssl: {
    rejectUnauthorized: false  // Aceitar certificados SSL auto-assinados, importante para alguns ambientes
  }
};

// Criar o pool de conexões
export const pool = new Pool(poolConfig);

// Eventos do pool de conexões para melhor observabilidade
pool.on('error', (err) => {
  console.error('[DB] Erro no pool de conexões:', err);
  
  // Tentar reconectar em caso de erro
  console.log('[DB] Tentando reconectar em 5 segundos...');
  setTimeout(async () => {
    try {
      const client = await pool.connect();
      console.log('[DB] Reconexão bem-sucedida');
      client.release();
    } catch (reconnectError) {
      console.error('[DB] Falha ao reconectar:', reconnectError);
    }
  }, 5000);
});

pool.on('connect', () => {
  console.log('[DB] Nova conexão PostgreSQL estabelecida');
});

// Função para testar a conexão com o banco
export async function testConnection() {
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

// Criar a instância do Drizzle ORM
export const db = drizzle(pool, { 
  schema,
  logger: isDevelopment // Ativar logs apenas em desenvolvimento
});