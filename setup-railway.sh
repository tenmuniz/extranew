#!/bin/bash

echo "=== Script de Configuração do Banco de Dados no Railway ==="
echo "Este script deve ser executado APÓS o primeiro deploy no Railway."
echo "Certifique-se de que o banco de dados PostgreSQL já foi provisionado."
echo

# Executar a migração para criar as tabelas
echo "Criando tabelas no banco de dados..."
npm run db:push

# Verificar se a migração foi bem-sucedida
if [ $? -eq 0 ]; then
  echo "✅ Migração bem-sucedida! Tabelas criadas."
  echo "A aplicação agora deve estar funcionando corretamente."
  echo "Acesse a URL fornecida pelo Railway para acessar a aplicação."
else
  echo "❌ Erro durante a migração."
  echo "Verifique a conexão com o banco de dados e tente novamente."
  echo "Certifique-se de que a variável DATABASE_URL está configurada corretamente."
  exit 1
fi