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
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    // Construir o caminho para o arquivo de migração
    const projectRoot = path.resolve(__dirname, '..');
    const migrationFile = path.join(projectRoot, 'migrations', 'initial.sql');
    console.log(`[Migração] Lendo arquivo de migração: ${migrationFile}`);
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`Arquivo de migração não encontrado: ${migrationFile}`);
      
      // Em produção, vamos criar o SQL de migração diretamente 
      if (isProduction) {
        console.log("[Migração] Ambiente de produção: criando script de migração internamente");
        
        const migrationInlineSQL = `
        -- Initial schema migration
        CREATE TABLE IF NOT EXISTS "personnel" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "rank" TEXT NOT NULL,
          "extras" INTEGER NOT NULL DEFAULT 0,
          "platoon" TEXT NOT NULL DEFAULT 'EXPEDIENTE'
        );

        CREATE TABLE IF NOT EXISTS "assignments" (
          "id" SERIAL PRIMARY KEY,
          "personnel_id" INTEGER NOT NULL,
          "operation_type" TEXT NOT NULL,
          "date" DATE NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY ("personnel_id") REFERENCES "personnel"("id") ON DELETE CASCADE
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS "assignments_personnel_id_idx" ON "assignments" ("personnel_id");
        CREATE INDEX IF NOT EXISTS "assignments_date_idx" ON "assignments" ("date");
        CREATE INDEX IF NOT EXISTS "assignments_operation_type_idx" ON "assignments" ("operation_type");
        `;
        
        const client = await pool.connect();
        console.log("[Migração] Conexão com banco de dados estabelecida");
        
        try {
          // Iniciar uma transação
          await client.query('BEGIN');
          
          // Executar o script de migração
          console.log("[Migração] Executando script de migração interno...");
          await client.query(migrationInlineSQL);
          
          // Confirmar a transação
          await client.query('COMMIT');
          console.log("[Migração] Migração executada com sucesso!");
          
          // Liberar o cliente e retornar
          client.release();
          return true;
        } catch (error) {
          // Em caso de erro, reverter a transação
          await client.query('ROLLBACK');
          console.error("[Migração] Erro ao executar migração interna:", error);
          throw error;
        } finally {
          // Liberar o cliente
          client.release();
        }
      } else {
        throw new Error(`Arquivo de migração não encontrado: ${migrationFile}`);
      }
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