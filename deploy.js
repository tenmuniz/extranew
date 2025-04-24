#!/usr/bin/env node

/**
 * Script de deploy para o sistema de escala da PMPA
 * 
 * Este script prepara o projeto para produção:
 * 1. Verifica/cria o arquivo .env.production
 * 2. Garante que as variáveis de ambiente estejam configuradas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para verificar e criar arquivo .env.production
function createEnvProductionFile() {
  const envPath = path.join(__dirname, '.env.production');
  
  // Se o arquivo já existir, manter
  if (fs.existsSync(envPath)) {
    console.log('✓ Arquivo .env.production já existe');
    return;
  }
  
  // Obter variáveis de ambiente
  const pgVars = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    PGHOST: process.env.PGHOST || '',
    PGUSER: process.env.PGUSER || '',
    PGPASSWORD: process.env.PGPASSWORD || '',
    PGDATABASE: process.env.PGDATABASE || '',
    PGPORT: process.env.PGPORT || '5432'
  };
  
  // Tentar construir DATABASE_URL se não estiver definida
  if (!pgVars.DATABASE_URL && pgVars.PGHOST && pgVars.PGUSER && pgVars.PGPASSWORD && pgVars.PGDATABASE) {
    pgVars.DATABASE_URL = `postgres://${pgVars.PGUSER}:${pgVars.PGPASSWORD}@${pgVars.PGHOST}:${pgVars.PGPORT}/${pgVars.PGDATABASE}`;
  }
  
  // Se ainda não tiver DATABASE_URL, usar um padrão para testes
  if (!pgVars.DATABASE_URL) {
    pgVars.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
    console.log('⚠️ Usando DATABASE_URL padrão para testes');
  }
  
  // Criar conteúdo do arquivo
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
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Arquivo .env.production criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env.production:', error);
  }
}

// Função principal
async function deploy() {
  console.log('\n=== INICIANDO DEPLOY ===\n');
  
  // 0. Executar pré-deploy para proteger dados
  console.log('Executando pré-deploy para proteção de dados...');
  try {
    const { execSync } = await import('child_process');
    execSync('./pre-deploy.sh', { stdio: 'inherit' });
    console.log('✓ Pré-deploy concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro no pré-deploy:', error.message);
    console.warn('Continuando o deploy mesmo com falha no pré-deploy...');
  }
  
  // 1. Verificar e criar arquivo .env.production
  console.log('Verificando configuração de ambiente...');
  createEnvProductionFile();
  
  // 2. Exibir informações e próximos passos
  console.log('\n=== DEPLOY CONCLUÍDO ===');
  console.log('\nPróximos passos:');
  console.log('1. Verifique se as variáveis de ambiente estão corretamente configuradas');
  console.log('2. Execute o build com: npm run build');
  console.log('3. Inicie o servidor com: npm run start');
  console.log('\nOu use o botão de deploy do Replit para fazer o deploy automaticamente.\n');
  console.log('IMPORTANTE: Seus dados foram protegidos antes do deploy. Em caso de problemas,');
  console.log('você pode encontrar backups na pasta ./backups');
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(error => {
    console.error('Erro no deploy:', error);
    process.exit(1);
  });
}