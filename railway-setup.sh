#!/bin/bash

# Script de configuração para Railway
# Este script deve ser executado após o clone do repositório no Railway

echo "===== Script de Configuração do Railway ====="
echo "Iniciando configuração da aplicação 20ª CIPM - Sistema de Escalas"
echo

# Verificar se estamos em ambiente Railway
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
  echo "AVISO: Esta não parece ser uma instalação no Railway."
  echo "O script continuará, mas algumas funcionalidades podem não funcionar como esperado."
else
  echo "✅ Ambiente Railway detectado: $RAILWAY_ENVIRONMENT"
fi

# Passo 1: Verificar Node.js
echo "Verificando versão do Node.js..."
NODE_VERSION=$(node -v)
echo "Versão do Node.js: $NODE_VERSION"

# Passo 2: Renomear package.json para garantir compatibilidade
echo "Configurando package.json para Railway..."
if [ -f "package.railway.json" ]; then
  cp package.railway.json package.json
  echo "✅ package.json configurado para Railway."
else
  echo "⚠️ package.railway.json não encontrado. Usando package.json existente."
fi

# Passo 3: Verificar conexão com o banco de dados
echo "Verificando conexão com o banco de dados..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL não está configurada. O sistema usará armazenamento em memória."
  echo "Para usar banco de dados, configure a variável DATABASE_URL no painel do Railway."
else
  echo "✅ DATABASE_URL configurada."
fi

# Passo 4: Construir a aplicação
echo "Construindo a aplicação..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro durante a construção da aplicação."
  exit 1
else
  echo "✅ Aplicação construída com sucesso."
fi

# Passo 5: Verificar Procfile
echo "Verificando Procfile..."
if [ -f "Procfile" ]; then
  echo "✅ Procfile encontrado."
else
  echo "⚠️ Procfile não encontrado. Criando um padrão..."
  echo "web: node -r ./setup-environment.js dist/server/index.js" > Procfile
  echo "✅ Procfile criado."
fi

# Passo 6: Inicializar banco de dados (se configurado)
if [ ! -z "$DATABASE_URL" ]; then
  echo "Inicializando banco de dados..."
  npm run db:push
  if [ $? -ne 0 ]; then
    echo "⚠️ Aviso: Falha ao executar migrações do banco de dados."
    echo "Tente executar 'npm run db:push' manualmente após o deploy."
  else
    echo "✅ Banco de dados inicializado com sucesso."
  fi
fi

echo
echo "===== Configuração concluída! ====="
echo "A aplicação está pronta para ser executada no Railway."
echo "Use 'npm start' para iniciar o servidor."
echo