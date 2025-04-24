import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { BackupUtility } from './backup-utility';

// Configurações
const DATA_DIR = join(process.cwd(), 'data');
const PERSONNEL_FILE = join(DATA_DIR, 'personnel.json');
const ASSIGNMENTS_FILE = join(DATA_DIR, 'assignments.json');

/**
 * Utilitário para restaurar dados de backup após o deploy
 */
export class RestoreUtility {
  /**
   * Restaura dados do último backup de produção
   * Deve ser chamado após o deploy
   */
  static async restoreProductionData(): Promise<boolean> {
    try {
      console.log('[Restore] Iniciando restauração dos dados de produção...');
      
      // Obter o backup mais recente de produção
      const backupDir = BackupUtility.getLatestBackup('production');
      if (!backupDir) {
        console.warn('[Restore] Nenhum backup de produção encontrado. Não é possível restaurar dados.');
        return false;
      }
      
      console.log(`[Restore] Usando backup de produção: ${backupDir}`);
      
      // Restaurar dados de pessoal
      const personnelBackupFile = join(backupDir, 'personnel.json');
      if (existsSync(personnelBackupFile)) {
        try {
          const personnelData = readFileSync(personnelBackupFile, 'utf8');
          writeFileSync(PERSONNEL_FILE, personnelData);
          console.log(`[Restore] Dados de pessoal restaurados de ${personnelBackupFile}`);
        } catch (error) {
          console.error('[Restore] Erro ao restaurar dados de pessoal:', error);
        }
      }
      
      // Restaurar dados de atribuições
      const assignmentsBackupFile = join(backupDir, 'assignments.json');
      if (existsSync(assignmentsBackupFile)) {
        try {
          const assignmentsData = readFileSync(assignmentsBackupFile, 'utf8');
          writeFileSync(ASSIGNMENTS_FILE, assignmentsData);
          console.log(`[Restore] Atribuições restauradas de ${assignmentsBackupFile}`);
        } catch (error) {
          console.error('[Restore] Erro ao restaurar atribuições:', error);
        }
      }
      
      console.log('[Restore] Restauração de dados concluída com sucesso!');
      return true;
    } catch (error) {
      console.error('[Restore] Erro durante a restauração de dados:', error);
      return false;
    }
  }
}

// Função para restaurar dados após o deploy
export async function restoreAfterDeploy() {
  try {
    console.log('\n=== INICIANDO RESTAURAÇÃO PÓS-DEPLOY ===\n');
    
    // Esperar um pouco para garantir que os arquivos estejam prontos
    console.log('[Restore] Aguardando 5 segundos para garantir que o sistema está estável...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Restaurar dados de produção
    const success = await RestoreUtility.restoreProductionData();
    
    if (success) {
      console.log('\n✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('\nSeus dados de produção foram restaurados após o deploy.');
    } else {
      console.warn('\n⚠️ RESTAURAÇÃO INCOMPLETA');
      console.warn('\nAlguns dados podem não ter sido restaurados corretamente.');
    }
    
    return success;
  } catch (error) {
    console.error('\n❌ ERRO NA RESTAURAÇÃO:', error);
    return false;
  }
}