#!/bin/bash

# Script para executar o pré-deploy
echo "Executando pré-deploy para preservar dados..."
npx tsx pre-deploy.ts

# Verifica se o pré-deploy foi bem-sucedido
if [ $? -eq 0 ]; then
  echo "Pré-deploy concluído com sucesso!"
  exit 0
else
  echo "Erro no pré-deploy. Abortar deploy."
  exit 1
fi