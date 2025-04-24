#!/usr/bin/env tsx

/**
 * Script de pré-deploy para o sistema de escala da PMPA
 * 
 * Este script deve ser executado antes do deploy para garantir que os dados
 * existentes em produção não sejam perdidos durante a atualização.
 * 
 * Uso:
 *   npm run pre-deploy
 */

import { prepareForSafeDeploy } from './server/backup-utility';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('\n=== INICIANDO PRÉ-DEPLOY ===\n');
  console.log('Este script garante que seus dados não serão perdidos durante o deploy.');

  // Garantir que o diretório data existe
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('✓ Diretório de dados criado');
  }

  // Executar preparação para deploy seguro
  const success = await prepareForSafeDeploy();
  
  if (success) {
    console.log('\n✅ PRÉ-DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('\nSeus dados estão protegidos. Você pode prosseguir com o deploy com segurança.');
    console.log('Execute o deploy usando o botão de deploy do Replit ou manualmente.');
  } else {
    console.error('\n❌ FALHA NO PRÉ-DEPLOY!');
    console.error('\nOcorreu um erro durante a preparação para o deploy.');
    console.error('Recomendamos verificar os logs e resolver os problemas antes de prosseguir.');
  }
}

// Executar o script
main().catch(error => {
  console.error('Erro fatal no pré-deploy:', error);
  process.exit(1);
});