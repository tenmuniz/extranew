#!/bin/bash

# Script de configuração para o Railway

echo "Iniciando configuração para o Railway..."

# Verificar se as variáveis de ambiente necessárias estão definidas
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: A variável de ambiente DATABASE_URL não está definida."
  echo "Configure-a nas variáveis de ambiente do projeto no Railway."
  exit 1
fi

# Verificar se a variável NODE_ENV está configurada
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV não definida, configurando para 'production'"
  export NODE_ENV="production"
fi

echo "Ambiente: $NODE_ENV"
echo "PostgreSQL: $DATABASE_URL (mascarado para segurança)"

# Testar conexão com o banco de dados
echo "Testando conexão com o banco de dados..."
npx drizzle-kit generate
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao conectar com o banco de dados. Tentando novamente com mais detalhes de erro..."
  npx drizzle-kit generate --verbose
  exit 1
fi

# Executar migrações
echo "Aplicando migrações..."
npm run db:push
if [ $? -ne 0 ]; then
  echo "ERRO: Falha ao aplicar migrações. Tentando método alternativo..."
  node -e "
    const { drizzle } = require('drizzle-orm/neon-serverless');
    const { Pool } = require('@neondatabase/serverless');
    const ws = require('ws');
    const schema = require('./dist/shared/schema.js');
    
    async function pushSchema() {
      console.log('Inicializando conexão direta com o banco...');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle({ client: pool, schema });
      console.log('Conexão estabelecida, aplicando schema...');
      try {
        // Tenta criar as tabelas manualmente
        await pool.query(\`
          CREATE TABLE IF NOT EXISTS personnel (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            rank TEXT NOT NULL,
            platoon TEXT,
            extra_info TEXT
          );
          
          CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            personnel_id INTEGER NOT NULL,
            operation_type TEXT NOT NULL,
            date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        \`);
        console.log('Tabelas criadas com sucesso!');
      } catch (error) {
        console.error('Erro ao criar tabelas:', error);
        process.exit(1);
      }
      pool.end();
    }
    
    pushSchema().catch(console.error);
  "
  
  if [ $? -ne 0 ]; then
    echo "ERRO: Todas as tentativas de migração falharam."
    exit 1
  fi
fi

echo "Configuração do Railway concluída com sucesso!"