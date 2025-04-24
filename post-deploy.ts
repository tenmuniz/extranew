#!/usr/bin/env tsx

/**
 * Script de pós-deploy para o sistema de escala da PMPA
 * 
 * Este script é executado após o deploy para restaurar automaticamente
 * os dados existentes no site em produção.
 * 
 * Uso:
 *   npm run post-deploy
 */

import { restoreAfterDeploy } from './server/restore-utility';

async function main() {
  console.log('\n=== INICIANDO PÓS-DEPLOY ===\n');
  console.log('Este script restaura automaticamente os dados de produção após o deploy.');

  try {
    // Restaurar dados após o deploy
    const success = await restoreAfterDeploy();
    
    if (success) {
      console.log('\n✅ PÓS-DEPLOY CONCLUÍDO COM SUCESSO!');
      console.log('\nSeus dados foram restaurados e o sistema está pronto para uso.');
    } else {
      console.warn('\n⚠️ PÓS-DEPLOY INCOMPLETO');
      console.warn('\nAlguns dados podem não ter sido restaurados. Verifique os logs para mais detalhes.');
    }
  } catch (error) {
    console.error('\n❌ ERRO NO PÓS-DEPLOY:', error);
    process.exit(1);
  }
}

// Executar o script
main().catch(error => {
  console.error('Erro fatal no pós-deploy:', error);
  process.exit(1);
});