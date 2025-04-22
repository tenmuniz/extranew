#!/bin/bash

# Script para compilar o aplicativo para produção

echo "Iniciando compilação do aplicativo..."

# Compilar o frontend
echo "Compilando o frontend com Vite..."
npx vite build

# Compilar o backend
echo "Compilando o backend com ESBuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Copiar arquivos importantes
echo "Copiando Procfile para a pasta dist..."
cp Procfile dist/

echo "Compilação concluída com sucesso!"