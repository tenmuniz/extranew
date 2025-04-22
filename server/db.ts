import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para WebSockets do Neon Database
neonConfig.webSocketConstructor = ws;

// Verifica se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Cria pool com opções de conexão mais robustas
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Limita o número máximo de conexões
  idleTimeoutMillis: 30000,   // Tempo de expiração de conexões inativas
  connectionTimeoutMillis: 5000, // Tempo limite para novas conexões
  allowExitOnIdle: false      // Não permitir saída quando inativo
});

// Configurar listeners para o pool de conexões
pool.on('error', (err) => {
  console.error('Pool de conexão PostgreSQL encontrou um erro:', err);
});

pool.on('connect', () => {
  console.log('Nova conexão PostgreSQL estabelecida');
});

// Instancia o cliente drizzle com tratamento de erros melhorado
export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? true : false
});