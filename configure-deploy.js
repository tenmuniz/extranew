#!/usr/bin/env node

/**
 * Script de configuração para deploy da aplicação
 * 
 * Este script realiza as seguintes ações:
 * 1. Verifica se o banco de dados está configurado
 * 2. Cria o arquivo .env.production com as configurações
 * 3. Prepara a aplicação para o ambiente de produção
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para verificar variáveis de ambiente do banco de dados
function checkDatabaseConfig() {
  console.log('\n=== Verificando configuração do banco de dados ===');
  
  const pgVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    PGHOST: process.env.PGHOST,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE,
    PGPORT: process.env.PGPORT
  };
  
  let hasConfig = false;
  
  if (pgVars.DATABASE_URL) {
    console.log('✓ DATABASE_URL está definida');
    hasConfig = true;
  } else if (pgVars.PGHOST && pgVars.PGUSER && pgVars.PGPASSWORD && pgVars.PGDATABASE) {
    console.log('✓ Variáveis individuais do PostgreSQL estão definidas');
    
    // Construir DATABASE_URL
    const port = pgVars.PGPORT || '5432';
    pgVars.DATABASE_URL = `postgres://${pgVars.PGUSER}:${pgVars.PGPASSWORD}@${pgVars.PGHOST}:${port}/${pgVars.PGDATABASE}`;
    process.env.DATABASE_URL = pgVars.DATABASE_URL;
    
    console.log(`✓ DATABASE_URL construída: postgres://${pgVars.PGUSER}:***@${pgVars.PGHOST}:${port}/${pgVars.PGDATABASE}`);
    hasConfig = true;
  } else {
    console.log('⚠️ Configuração do banco de dados não encontrada');
    console.log('Tentando usar configuração padrão do Replit');
    
    // Usar configuração padrão do Replit
    const defaultDb = process.env.REPL_SLUG || 'postgres';
    pgVars.DATABASE_URL = `postgres://postgres:postgres@localhost:5432/${defaultDb}`;
    process.env.DATABASE_URL = pgVars.DATABASE_URL;
    pgVars.PGHOST = 'localhost';
    pgVars.PGUSER = 'postgres';
    pgVars.PGPASSWORD = 'postgres';
    pgVars.PGDATABASE = defaultDb;
    pgVars.PGPORT = '5432';
    
    console.log(`✓ Usando configuração padrão: postgres://postgres:***@localhost:5432/${defaultDb}`);
    hasConfig = true;
  }
  
  return { hasConfig, pgVars };
}

// Função para criar arquivo .env.production
function createEnvFile(pgVars) {
  console.log('\n=== Criando arquivo .env.production ===');
  
  const envPath = path.join(__dirname, '.env.production');
  const envContent = `# Configuração de ambiente para produção
# Gerado automaticamente em ${new Date().toISOString()}

# Variáveis do PostgreSQL
DATABASE_URL=${pgVars.DATABASE_URL || ''}
PGHOST=${pgVars.PGHOST || ''}
PGUSER=${pgVars.PGUSER || ''}
PGPASSWORD=${pgVars.PGPASSWORD || ''}
PGDATABASE=${pgVars.PGDATABASE || ''}
PGPORT=${pgVars.PGPORT || '5432'}

# Configurações da aplicação
NODE_ENV=production
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✓ Arquivo ${envPath} criado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo ${envPath}:`, error);
    return false;
  }
}

// Função para testar conexão com o banco de dados
async function testDatabaseConnection() {
  console.log('\n=== Testando conexão com o banco de dados ===');
  
  try {
    // Executar comando de teste
    const testResult = execSync('node -e "import(\\"./server/db.js\\").then(({testConnection}) => testConnection()).catch(e => { console.error(e); process.exit(1); })"', {
      timeout: 10000,
      encoding: 'utf8'
    });
    
    console.log(testResult);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão com o banco de dados:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('\n========================================');
  console.log('=== CONFIGURAÇÃO DE DEPLOY INICIADA ===');
  console.log('========================================\n');
  
  // 1. Verificar configuração do banco de dados
  const { hasConfig, pgVars } = checkDatabaseConfig();
  if (!hasConfig) {
    console.error('❌ Não foi possível determinar a configuração do banco de dados');
    return false;
  }
  
  // 2. Criar arquivo .env.production
  const envCreated = createEnvFile(pgVars);
  if (!envCreated) {
    console.error('❌ Falha ao criar arquivo .env.production');
    return false;
  }
  
  // 3. Verificar a existência de arquivos cruciais
  console.log('\n=== Verificando arquivos cruciais ===');
  const crucialFiles = [
    'package.json',
    'vite.config.ts',
    'server/index.ts',
    'server/db.ts',
    'shared/schema.ts'
  ];
  
  let missingFiles = false;
  for (const file of crucialFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo crucial não encontrado: ${file}`);
      missingFiles = true;
    } else {
      console.log(`✓ Arquivo encontrado: ${file}`);
    }
  }
  
  if (missingFiles) {
    console.error('❌ Alguns arquivos cruciais estão faltando');
    return false;
  }
  
  console.log('\n==========================================');
  console.log('=== CONFIGURAÇÃO DE DEPLOY CONCLUÍDA ===');
  console.log('==========================================\n');
  
  console.log('Próximos passos:');
  console.log('1. Execute o build: npm run build');
  console.log('2. Inicie o servidor: npm run start');
  console.log('3. Ou use o botão de deploy do Replit\n');
  
  return true;
}

// Executar diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  });
}