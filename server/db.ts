import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configurar o WebSocket para Neon DB
neonConfig.webSocketConstructor = ws;

// Verificar se a variável de ambiente DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Lembre-se de configurar a variável de ambiente no Railway ou em .env local.",
  );
}

// Configurações avançadas para o pool de conexões
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar inativa antes de ser encerrada
  connectionTimeoutMillis: 5000, // Tempo máximo de espera para uma nova conexão
};

// Criar o pool de conexões
export const pool = new Pool(poolConfig);

// Log quando o pool é criado
console.log("Pool de conexões PostgreSQL criado");

// Estabelecer conexão com o banco usando Drizzle ORM
export const db = drizzle(pool, { schema });

// Tratamento de erros do pool de conexões
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do PostgreSQL:', err);
});

// Função para encerrar o pool de conexões
export const closePool = async () => {
  await pool.end();
  console.log('Pool de conexões PostgreSQL encerrado');
};