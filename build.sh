#!/bin/bash

# Script para compilar o aplicativo para produção

echo "Iniciando compilação do aplicativo..."

# Verificar NODE_ENV
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV não está definido, usando 'production' como padrão"
  export NODE_ENV=production
fi

echo "Ambiente de compilação: $NODE_ENV"

# Compilar o frontend
echo "Compilando o frontend com Vite..."
npx vite build

# Compilar o backend
echo "Compilando o backend com ESBuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Copiar arquivos importantes
echo "Copiando Procfile para a pasta dist..."
cp Procfile dist/

# Copiar diretórios necessários para o funcionamento do PWA
echo "Copiando arquivos do PWA..."
mkdir -p dist/client/public/icons
cp -r client/public/icons dist/client/public/
cp client/public/service-worker.js dist/client/public/
cp client/public/manifest.json dist/client/public/
cp client/public/offline.html dist/client/public/

# Verificar DATABASE_URL para alertar o usuário
if [ -z "$DATABASE_URL" ]; then
  echo "AVISO: A variável DATABASE_URL não está definida."
  echo "Por favor, certifique-se de definir DATABASE_URL em seu ambiente de produção (Railway, etc.)"
else
  echo "DATABASE_URL está configurada."
fi

echo "Compilação concluída com sucesso!"