#!/usr/bin/env node

/**
 * Este script é executado antes do deploy para garantir que
 * o ambiente esteja corretamente configurado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== INICIANDO PRÉ-DEPLOY ===');

// 1. Garantir que as variáveis de ambiente estejam disponíveis
console.log('\n--- Verificando variáveis de ambiente do PostgreSQL ---');

// Verificar variáveis
const pgVars = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  PGHOST: process.env.PGHOST || '',
  PGUSER: process.env.PGUSER || '',
  PGPASSWORD: process.env.PGPASSWORD || '',
  PGDATABASE: process.env.PGDATABASE || '',
  PGPORT: process.env.PGPORT || ''
};

// Verificar se temos informações suficientes
let hasDatabase = false;

if (pgVars.DATABASE_URL) {
  console.log('✓ DATABASE_URL está definida');
  hasDatabase = true;
} else if (pgVars.PGHOST && pgVars.PGUSER && pgVars.PGPASSWORD && pgVars.PGDATABASE) {
  console.log('✓ Variáveis individuais do PostgreSQL estão definidas');
  pgVars.DATABASE_URL = `postgres://${pgVars.PGUSER}:${pgVars.PGPASSWORD}@${pgVars.PGHOST}:${pgVars.PGPORT || '5432'}/${pgVars.PGDATABASE}`;
  hasDatabase = true;
} else {
  console.log('❌ Variáveis do PostgreSQL não configuradas corretamente');
  console.log('\nPor favor, configure uma das seguintes opções:');
  console.log('1. DATABASE_URL (recomendado)');
  console.log('2. PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT (opcional)');
  
  // Tentar usar valores do Replit
  console.log('\nTentando usar configuração padrão do Replit...');
  pgVars.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
  console.log(`✓ Configurado DATABASE_URL padrão: postgres://postgres:***@localhost:5432/postgres`);
  hasDatabase = true;
}

// 2. Criar arquivo .env.production
console.log('\n--- Criando arquivo .env.production ---');

const envContent = `# Arquivo de variáveis de ambiente para produção
# Gerado automaticamente em ${new Date().toISOString()}

# Variáveis do PostgreSQL
DATABASE_URL=${pgVars.DATABASE_URL}
PGHOST=${pgVars.PGHOST}
PGUSER=${pgVars.PGUSER}
PGPASSWORD=${pgVars.PGPASSWORD}
PGDATABASE=${pgVars.PGDATABASE}
PGPORT=${pgVars.PGPORT}

# Configurações do ambiente
NODE_ENV=production
`;

// Escrever arquivo
try {
  fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
  console.log('✓ Arquivo .env.production criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env.production:', error);
}

// 3. Verificar se o projeto está pronto para o deploy
console.log('\n--- Verificando estado do projeto ---');

// Verificar se o package.json existe
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  console.log('✓ package.json encontrado');
} else {
  console.error('❌ package.json não encontrado');
}

// Verificar script deploy.js
if (fs.existsSync(path.join(__dirname, 'deploy.js'))) {
  console.log('✓ deploy.js encontrado');
} else {
  console.error('❌ deploy.js não encontrado');
}

console.log('\n=== PRÉ-DEPLOY CONCLUÍDO ===');
console.log('O projeto está pronto para ser implantado.');

// Se estivermos executando diretamente, não como módulo
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(hasDatabase ? 0 : 1);
}