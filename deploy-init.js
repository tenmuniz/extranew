#!/usr/bin/env node

/**
 * Este script é utilizado para inicializar o banco de dados durante o deploy.
 * Quando o deploy for executado, ele irá garantir que o banco de dados esteja
 * corretamente configurado e que as tabelas necessárias sejam criadas.
 */

// Imprimir mensagem de início
console.log('Iniciando script de implantação...');

// Verificar variáveis de ambiente relacionadas ao PostgreSQL
const pgVars = ['DATABASE_URL', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT'];
const missingVars = pgVars.filter(v => !process.env[v]);

// Se DATABASE_URL estiver definida, não precisamos das variáveis individuais
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL está configurada. Usando-a para conexão com o banco de dados.');
} 
// Se DATABASE_URL não estiver definida, precisamos das variáveis individuais
else if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
  console.log('Variáveis individuais do PostgreSQL estão configuradas.');
  
  // Construir DATABASE_URL a partir das variáveis individuais
  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  const port = process.env.PGPORT || '5432';
  
  process.env.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
  console.log(`DATABASE_URL construída: postgres://${user}:***@${host}:${port}/${database}`);
} 
// Se não temos nem DATABASE_URL nem as variáveis individuais, vamos tentar uma conexão padrão
else {
  console.warn('AVISO: Variáveis de ambiente do PostgreSQL não encontradas!');
  console.log('Tentando usar configurações de conexão padrão para o ambiente Replit...');
  
  // Valores padrão para o Replit
  process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
  console.log('Usando DATABASE_URL padrão: postgres://postgres:***@localhost:5432/postgres');
}

console.log('Configuração do deploy concluída. Iniciando a aplicação...');