// Este script deve ser executado antes do deploy para configurar 
// corretamente as variáveis de ambiente no ambiente de produção

import fs from 'fs';

console.log('Configurando ambiente para deploy...');

// Lista de variáveis de ambiente do PostgreSQL que precisamos transferir
const pgVars = [
  'DATABASE_URL',
  'PGHOST',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  'PGPORT'
];

// Objeto para armazenar os valores das variáveis de ambiente
const envVars = {};

// Coletar os valores das variáveis de ambiente
pgVars.forEach(varName => {
  if (process.env[varName]) {
    envVars[varName] = process.env[varName];
    console.log(`✓ ${varName} encontrada`);
  } else {
    console.log(`✗ ${varName} não encontrada`);
  }
});

// Garantir que pelo menos DATABASE_URL ou as variáveis individuais estejam disponíveis
if (!envVars.DATABASE_URL && !(envVars.PGHOST && envVars.PGUSER && envVars.PGPASSWORD && envVars.PGDATABASE)) {
  console.log('Nenhuma configuração de banco de dados válida encontrada.');
  console.log('Por favor, configure DATABASE_URL ou as variáveis individuais (PGHOST, PGUSER, etc.)');
  
  // Sugestão de solução
  console.log('\nVocê precisa adicionar as variáveis de ambiente do PostgreSQL na página do Replit:');
  console.log('1. Vá para a aba "Secrets" no seu Replit');
  console.log('2. Adicione as seguintes variáveis com seus valores:');
  console.log('   - DATABASE_URL (recomendado)');
  console.log('   - ou PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT (opcional)');
  
  // Saída com código de erro
  process.exit(1);
} else {
  console.log('Configuração de banco de dados válida encontrada.');
  
  // Se tivermos as variáveis individuais mas não DATABASE_URL, construa-a
  if (!envVars.DATABASE_URL && envVars.PGHOST && envVars.PGUSER && envVars.PGPASSWORD && envVars.PGDATABASE) {
    const host = envVars.PGHOST;
    const user = envVars.PGUSER;
    const password = envVars.PGPASSWORD;
    const database = envVars.PGDATABASE;
    const port = envVars.PGPORT || '5432';
    
    envVars.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
    console.log(`DATABASE_URL construída a partir das variáveis individuais`);
  }
  
  // Adicionar sugestão para o arquivo .env se não existir
  console.log('Criando ou atualizando arquivo .env.production para o deploy...');
  
  // Criar conteúdo do arquivo .env
  let envContent = '# Arquivo de variáveis de ambiente para produção\n';
  envContent += '# Gerado automaticamente em ' + new Date().toISOString() + '\n\n';
  
  // Adicionar cada variável ao arquivo (exceto senha por segurança nos logs)
  Object.entries(envVars).forEach(([key, value]) => {
    const displayValue = key === 'PGPASSWORD' ? '********' : value;
    console.log(`Adicionando ${key}=${displayValue}`);
    envContent += `${key}=${value}\n`;
  });
  
  // Escrever no arquivo .env.production
  try {
    fs.writeFileSync('.env.production', envContent);
    console.log('Arquivo .env.production criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar arquivo .env.production:', error);
  }
  
  console.log('\nPara garantir um deploy bem-sucedido:');
  console.log('1. Você deve configurar o seu projeto para carregar as variáveis de ambiente do arquivo .env.production');
  console.log('2. No painel "Deployments" do Replit, verifique se as mesmas variáveis estão configuradas');
  
  console.log('\nConfigurações de deploy concluídas com sucesso.');
}