// Script para inicializar o banco de dados no ambiente de deploy
import { pool } from './db.js';
import { sql } from 'drizzle-orm';

async function initializeDeployDatabase() {
  console.log("[Deploy] Inicializando banco de dados para deploy...");
  
  try {
    // Verificar conexão com o banco
    const client = await pool.connect();
    console.log("[Deploy] Conexão com banco de dados estabelecida");
    
    // Verificar se as tabelas existem
    const tablesExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'personnel'
      );
    `);
    
    // Se as tabelas não existirem, precisamos criar
    if (!tablesExist.rows[0].exists) {
      console.log("[Deploy] Criando tabelas no banco de dados...");
      
      // Criar tabela de personnel
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          rank TEXT NOT NULL,
          extras INTEGER NOT NULL DEFAULT 0,
          platoon TEXT NOT NULL DEFAULT 'EXPEDIENTE'
        );
      `);
      
      // Criar tabela de assignments
      await client.query(`
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          personnel_id INTEGER NOT NULL,
          operation_type TEXT NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
        );
      `);
      
      console.log("[Deploy] Tabelas criadas com sucesso");
    } else {
      console.log("[Deploy] Tabelas já existem no banco de dados");
    }
    
    // Verificar se há dados na tabela de personnel
    const personnelCount = await client.query("SELECT COUNT(*) FROM personnel");
    
    if (parseInt(personnelCount.rows[0].count) === 0) {
      console.log("[Deploy] Populando o banco de dados com dados iniciais...");
      
      // Adicionar dados iniciais de personnel se estiver vazio
      const samplePersonnel = [
        { name: "CAP MUNIZ", rank: "CAP", extras: 0, platoon: "EXPEDIENTE" },
        { name: "1º TEN QOPM MONTEIRO", rank: "1TEN", extras: 0, platoon: "EXPEDIENTE" },
        { name: "TEN VANILSON", rank: "TEN", extras: 0, platoon: "EXPEDIENTE" },
        { name: "SUB TEN ANDRÉ", rank: "SUBTEN", extras: 0, platoon: "EXPEDIENTE" },
        { name: "1º SGT PM OLIMAR", rank: "1SGT", extras: 0, platoon: "BRAVO" },
        { name: "2º SGT PM PEIXOTO", rank: "2SGT", extras: 0, platoon: "ALFA" },
        // Adicione outros conforme necessário
      ];
      
      // Inserir dados usando uma transação
      await client.query('BEGIN');
      
      for (const person of samplePersonnel) {
        await client.query(
          'INSERT INTO personnel (name, rank, extras, platoon) VALUES ($1, $2, $3, $4)',
          [person.name, person.rank, person.extras, person.platoon]
        );
      }
      
      await client.query('COMMIT');
      console.log("[Deploy] Dados iniciais inseridos com sucesso");
    } else {
      console.log("[Deploy] Banco de dados já contém dados");
    }
    
    client.release();
    console.log("[Deploy] Inicialização do banco de dados concluída com sucesso");
    
  } catch (error) {
    console.error("[Deploy] Erro ao inicializar banco de dados:", error);
  } finally {
    // Fechar o pool de conexões
    await pool.end();
  }
}

// Executar a função de inicialização
initializeDeployDatabase();