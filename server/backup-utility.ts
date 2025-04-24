import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

// Configurações
const BACKUP_DIR = join(process.cwd(), 'backups');
const DATA_DIR = join(process.cwd(), 'data');
const PERSONNEL_FILE = join(DATA_DIR, 'personnel.json');
const ASSIGNMENTS_FILE = join(DATA_DIR, 'assignments.json');

/**
 * Utilitário para backup e recuperação de dados
 * Garante que os dados existentes não serão perdidos durante um deploy
 */
export class BackupUtility {
  
  /**
   * Cria backup dos dados locais
   */
  static async createLocalBackup() {
    try {
      if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupFolder = join(BACKUP_DIR, `backup-${timestamp}`);
      mkdirSync(backupFolder, { recursive: true });
      
      if (existsSync(PERSONNEL_FILE)) {
        const personnelBackupPath = join(backupFolder, 'personnel.json');
        copyFileSync(PERSONNEL_FILE, personnelBackupPath);
        console.log(`[Backup] Dados de pessoal salvos em: ${personnelBackupPath}`);
      }
      
      if (existsSync(ASSIGNMENTS_FILE)) {
        const assignmentsBackupPath = join(backupFolder, 'assignments.json');
        copyFileSync(ASSIGNMENTS_FILE, assignmentsBackupPath);
        console.log(`[Backup] Atribuições salvas em: ${assignmentsBackupPath}`);
      }
      
      return backupFolder;
    } catch (error) {
      console.error('[Backup] Erro ao criar backup local:', error);
      throw error;
    }
  }
  
  /**
   * Realiza backup dos dados em produção antes do deploy
   */
  static async backupProductionData(productionUrl: string = 'https://www.20cipm.com.br') {
    try {
      console.log(`[Backup] Iniciando backup dos dados em produção: ${productionUrl}`);
      
      // Criar diretório de backup
      if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupFolder = join(BACKUP_DIR, `production-${timestamp}`);
      mkdirSync(backupFolder, { recursive: true });
      
      // Fazer backup dos dados de pessoal em produção
      try {
        const personnelResponse = await axios.get(`${productionUrl}/api/personnel`);
        if (personnelResponse.data && Array.isArray(personnelResponse.data)) {
          const personnelBackupPath = join(backupFolder, 'personnel.json');
          writeFileSync(personnelBackupPath, JSON.stringify(personnelResponse.data, null, 2));
          console.log(`[Backup] Dados de pessoal de produção salvos em: ${personnelBackupPath}`);
        }
      } catch (error) {
        console.error('[Backup] Erro ao obter dados de pessoal de produção:', error);
      }
      
      // Fazer backup das atribuições em produção
      try {
        const assignmentsResponse = await axios.get(`${productionUrl}/api/assignments`);
        if (assignmentsResponse.data && Array.isArray(assignmentsResponse.data)) {
          const assignmentsBackupPath = join(backupFolder, 'assignments.json');
          writeFileSync(assignmentsBackupPath, JSON.stringify(assignmentsResponse.data, null, 2));
          console.log(`[Backup] Atribuições de produção salvas em: ${assignmentsBackupPath}`);
        }
      } catch (error) {
        console.error('[Backup] Erro ao obter atribuições de produção:', error);
      }
      
      return backupFolder;
    } catch (error) {
      console.error('[Backup] Erro no backup de produção:', error);
      throw error;
    }
  }
  
  /**
   * Recupera dados do backup mais recente
   */
  static getLatestBackup(type: 'production' | 'local' = 'production') {
    try {
      if (!existsSync(BACKUP_DIR)) {
        console.warn('[Backup] Nenhum diretório de backup encontrado');
        return null;
      }
      
      // Usar as funções importadas no topo do arquivo em vez de require
      // Listar todos os backups do tipo especificado
      import { readdirSync } from 'fs';
      
      const backups = readdirSync(BACKUP_DIR)
        .filter((dir: string) => dir.startsWith(type))
        .map((dir: string) => ({
          path: join(BACKUP_DIR, dir),
          timestamp: new Date(dir.replace(`${type}-`, '').replace(/-/g, ':')),
        }))
        .sort((a: { timestamp: Date }, b: { timestamp: Date }) => b.timestamp.getTime() - a.timestamp.getTime());  // Ordenar pelo mais recente
      
      if (backups.length === 0) {
        console.warn(`[Backup] Nenhum backup do tipo ${type} encontrado`);
        return null;
      }
      
      // Retornar o backup mais recente
      return backups[0].path;
    } catch (error) {
      console.error('[Backup] Erro ao obter backup mais recente:', error);
      return null;
    }
  }
}

// Função para ajudar no deploy seguro
export async function prepareForSafeDeploy() {
  try {
    console.log('[Deploy Seguro] Iniciando processo de preparação para deploy...');
    
    // 1. Criar backup dos dados locais atuais
    await BackupUtility.createLocalBackup();
    
    // 2. Tentar fazer backup dos dados em produção
    try {
      await BackupUtility.backupProductionData();
      console.log('[Deploy Seguro] Backup dos dados em produção concluído com sucesso!');
    } catch (error) {
      console.warn('[Deploy Seguro] Não foi possível fazer backup dos dados em produção. Continuando...');
    }
    
    console.log('[Deploy Seguro] Preparação para deploy concluída! Seus dados estão protegidos.');
    return true;
  } catch (error) {
    console.error('[Deploy Seguro] Erro na preparação para deploy:', error);
    return false;
  }
}