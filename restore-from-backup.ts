/**
 * Script para restaurar manualmente dados do backup de produção
 * 
 * Este script importa os dados de um backup de produção específico
 * e os restaura para o sistema atual.
 */

import fs from 'fs';
import path from 'path';

// Caminho para o backup mais completo de produção
const BACKUP_PATH = 'backups/production-2025-04-24T14-57-07.037Z';

async function restoreDataFromBackup() {
  try {
    console.log('=== INICIANDO RESTAURAÇÃO MANUAL ===\n');
    
    // Verificar se o diretório de backup existe
    if (!fs.existsSync(BACKUP_PATH)) {
      console.error(`O diretório de backup ${BACKUP_PATH} não existe!`);
      return false;
    }
    
    // Verificar se os arquivos de backup existem
    const personnelBackupPath = path.join(BACKUP_PATH, 'personnel.json');
    const assignmentsBackupPath = path.join(BACKUP_PATH, 'assignments.json');
    
    if (!fs.existsSync(personnelBackupPath) || !fs.existsSync(assignmentsBackupPath)) {
      console.error('Arquivos de backup não encontrados!');
      return false;
    }
    
    // Ler os dados do backup
    console.log('[Restauração] Lendo dados do backup de produção...');
    const personnelData = JSON.parse(fs.readFileSync(personnelBackupPath, 'utf8'));
    const assignmentsData = JSON.parse(fs.readFileSync(assignmentsBackupPath, 'utf8'));
    
    console.log(`[Restauração] Encontrados ${personnelData.length} militares e ${assignmentsData.length} atribuições no backup.`);
    
    // Garantir que o diretório de dados existe
    const dataDir = 'data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`[Restauração] Diretório ${dataDir} criado.`);
    }
    
    // Salvar os dados no sistema atual
    console.log('[Restauração] Restaurando dados para o sistema atual...');
    fs.writeFileSync(path.join(dataDir, 'personnel.json'), JSON.stringify(personnelData, null, 2));
    fs.writeFileSync(path.join(dataDir, 'assignments.json'), JSON.stringify(assignmentsData, null, 2));
    
    console.log('\n✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('Os dados foram restaurados do backup de produção.');
    console.log('Reinicie o servidor para aplicar as alterações.\n');
    
    return true;
  } catch (error) {
    console.error(`[Restauração] Erro durante a restauração: ${error}`);
    return false;
  }
}

// Executar a restauração
restoreDataFromBackup();