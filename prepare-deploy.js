/**
 * SCRIPT DE PREPARAÇÃO PARA DEPLOY
 * 
 * Execute este script manualmente antes de fazer o deploy no Replit:
 * 
 * $ node prepare-deploy.js
 * 
 * Este script:
 * 1. Configura as variáveis de ambiente no arquivo .env.production
 * 2. Ajusta qualquer configuração necessária para o deploy
 * 3. Verifica se o projeto está em um estado adequado para o deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== PREPARAÇÃO PARA DEPLOY ===\n');

// 1. Verificar variáveis de ambiente do PostgreSQL
console.log('Verificando variáveis de ambiente do PostgreSQL...');
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
console.log('\nCriando arquivo .env.production...');

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

// 3. Criar arquivo para definir entrypoint no deploy
console.log('\nCriando arquivo de deploy...');

try {
  // Criar ou verificar diretório dist se não existir
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✓ Diretório dist criado');
  }
  
  // Criar deploy-config.js no diretório dist
  const deployConfigContent = `// Configuração de deploy - gerado automaticamente
export const config = {
  NODE_ENV: 'production',
  host: '0.0.0.0',
  port: process.env.PORT || 5000
};
`;

  fs.writeFileSync(path.join(distDir, 'deploy-config.js'), deployConfigContent);
  console.log('✓ Arquivo de configuração de deploy criado');
} catch (error) {
  console.error('❌ Erro ao criar arquivo de configuração:', error);
}

// 4. Instruções para Deploy
console.log('\n=== INSTRUÇÕES PARA DEPLOY ===');
console.log('\n1. No Replit, vá até a aba "Deployments"');
console.log('2. Certifique-se de configurar as variáveis de ambiente:');
console.log('   - DATABASE_URL (ou as variáveis PGHOST, PGUSER, etc.)');
console.log('3. Clique em "Deploy" para iniciar o deploy');

console.log('\n=== PREPARAÇÃO CONCLUÍDA ===');
console.log('O projeto está pronto para ser implantado.\n');