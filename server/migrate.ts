import { pool } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter o diretório atual para o ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigration() {
  console.log("[Migração] Iniciando processo de migração do banco de dados...");
  
  try {
    // Construir o caminho para o arquivo de migração
    const projectRoot = path.resolve(__dirname, '..');
    const migrationFile = path.join(projectRoot, 'migrations', 'initial.sql');
    console.log(`[Migração] Lendo arquivo de migração: ${migrationFile}`);
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log("[Migração] Arquivo de migração carregado com sucesso");
    
    // Conectar ao banco de dados
    const client = await pool.connect();
    console.log("[Migração] Conexão com banco de dados estabelecida");
    
    try {
      // Iniciar uma transação
      await client.query('BEGIN');
      
      // Executar o script de migração
      console.log("[Migração] Executando script de migração...");
      await client.query(migrationSQL);
      
      // Confirmar a transação
      await client.query('COMMIT');
      console.log("[Migração] Migração executada com sucesso!");
    } catch (error) {
      // Em caso de erro, reverter a transação
      await client.query('ROLLBACK');
      console.error("[Migração] Erro ao executar migração:", error);
      throw error;
    } finally {
      // Liberar o cliente
      client.release();
    }
    
    console.log("[Migração] Processo de migração concluído com sucesso");
    return true;
  } catch (error) {
    console.error("[Migração] Erro durante o processo de migração:", error);
    throw error;
  }
}

// Se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log("[Migração] Script de migração executado com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Migração] Falha na execução do script de migração:", error);
      process.exit(1);
    });
}