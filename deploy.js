import { initializeDeployDatabase } from './server/deploy-init.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para criar arquivo .env.production atualizado
function createEnvProductionFile() {
  const envContent = `# Arquivo de variáveis de ambiente para produção
# Gerado automaticamente em ${new Date().toISOString()}

# Variáveis do banco de dados
DATABASE_URL=${process.env.DATABASE_URL || ''}
PGHOST=${process.env.PGHOST || ''}
PGUSER=${process.env.PGUSER || ''}
PGPASSWORD=${process.env.PGPASSWORD || ''}
PGDATABASE=${process.env.PGDATABASE || ''}
PGPORT=${process.env.PGPORT || ''}

# Configurações do ambiente
NODE_ENV=production
`;

  // Salvar arquivo
  fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
  console.log('✓ Arquivo .env.production criado com sucesso');
  
  // Log das variáveis (exceto senha)
  console.log('\nVariáveis configuradas:');
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '******' : 'não definida'}`);
  console.log(`- PGHOST: ${process.env.PGHOST || 'não definida'}`);
  console.log(`- PGUSER: ${process.env.PGUSER || 'não definida'}`);
  console.log(`- PGDATABASE: ${process.env.PGDATABASE || 'não definida'}`);
  console.log(`- PGPORT: ${process.env.PGPORT || 'não definida'}`);
}

// Função principal de deploy
async function deploy() {
  console.log('=== INICIANDO DEPLOY ===');
  
  try {
    // Etapa 1: Criar arquivo .env.production
    console.log('\n--- Etapa 1: Configuração de variáveis de ambiente ---');
    createEnvProductionFile();
    
    // Etapa 2: Inicializar o banco de dados
    console.log('\n--- Etapa 2: Inicialização do banco de dados ---');
    await initializeDeployDatabase();
    console.log('✓ Banco de dados inicializado com sucesso');
    
    // Etapa 3: Outras operações de deploy, se necessário
    console.log('\n--- Etapa 3: Finalizando configurações ---');
    console.log('✓ Configurações finalizadas');
    
    // Mensagem de conclusão
    console.log('\n=== DEPLOY FINALIZADO COM SUCESSO ===');
    return { success: true };
  } catch (error) {
    console.error('\n=== ERRO DURANTE O DEPLOY ===');
    console.error(error);
    return { success: false, error };
  }
}

// Executar o deploy
deploy()
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro inesperado durante o deploy:', error);
    process.exit(1);
  });