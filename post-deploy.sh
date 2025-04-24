#!/bin/bash

# Script para executar o pós-deploy e restaurar dados automaticamente
echo "Executando pós-deploy para restaurar dados..."
npx tsx post-deploy.ts

# Verifica se o pós-deploy foi bem-sucedido
if [ $? -eq 0 ]; then
  echo "Pós-deploy concluído com sucesso!"
  exit 0
else
  echo "Erro no pós-deploy. Dados podem não ter sido restaurados completamente."
  exit 1
fi