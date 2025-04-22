import { db, pool } from "./db";
import { personnel, assignments, Rank, Platoon } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Função para inicializar o banco de dados com dados iniciais
export async function initializeDatabase() {
  try {
    console.log("[DB] Verificando a conexão com o banco de dados...");
    
    // Testar conexão explicitamente
    const client = await pool.connect();
    client.release();
    console.log("[DB] Conexão com o banco de dados estabelecida com sucesso.");
    
    // Verificar se a tabela personnel existe
    console.log("[DB] Verificando se o banco já está inicializado...");
    
    // Verificar se a tabela existe antes de fazer consultas
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'personnel'
      );
    `);
    
    if (!tableExists?.rows?.[0]?.exists) {
      console.log("[DB] A tabela 'personnel' não existe. Executando migração inicial...");
      // O Drizzle irá criar as tabelas automaticamente ao tentar acessá-las
      return;
    }
    
    // Verificar se já existem registros na tabela personnel
    const existingPersonnel = await db.select({ count: sql`count(*)` }).from(personnel);
    
    if (existingPersonnel?.[0] && parseInt(existingPersonnel[0].count as string) > 0) {
      console.log("[DB] O banco de dados já está inicializado com dados.");
      return;
    }
    
    console.log("[DB] Inicializando o banco de dados com dados de pessoal...");
    
    // Definir dados iniciais de pessoal com tipos corretos
    const samplePersonnel: { 
      name: string; 
      rank: Rank; 
      extras: number;
      platoon: Platoon;
    }[] = [
      // Capitão e oficiais primeiro (por ordem hierárquica - EXPEDIENTE)
      { name: "CAP MUNIZ", rank: "CAP", extras: 0, platoon: "EXPEDIENTE" },
      { name: "1º TEN QOPM MONTEIRO", rank: "1TEN", extras: 0, platoon: "EXPEDIENTE" },
      { name: "TEN VANILSON", rank: "TEN", extras: 0, platoon: "EXPEDIENTE" },
      { name: "SUB TEN ANDRÉ", rank: "SUBTEN", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição BRAVO 
      { name: "1º SGT PM OLIMAR", rank: "1SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição ALFA
      { name: "2º SGT PM PEIXOTO", rank: "2SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { name: "2º SGT PM FÁBIO", rank: "2SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { name: "2º SGT PM PINHEIRO", rank: "2SGT", extras: 0, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { name: "2º SGT PM A. TAVARES", rank: "2SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição ALFA
      { name: "3º SGT PM RODRIGO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM LEDO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM NUNES", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM AMARAL", rank: "3SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { name: "3º SGT PM ANA CLEIDE", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { name: "3º SGT PM GLEIDSON", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { name: "3º SGT PM CARLOS EDUARDO", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { name: "3º SGT PM NEGRÃO", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { name: "3º SGT PM RAFAEL", rank: "3SGT", extras: 0, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { name: "3º SGT PM CUNHA", rank: "3SGT", extras: 0, platoon: "EXPEDIENTE" },
      { name: "3º SGT PM CARAVELAS", rank: "3SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Cabos - Guarnição ALFA
      { name: "CB PM CARLA", rank: "CB", extras: 0, platoon: "ALFA" },
      { name: "CB PM FELIPE", rank: "CB", extras: 0, platoon: "ALFA" },
      { name: "CB PM BARROS", rank: "CB", extras: 0, platoon: "ALFA" },
      { name: "CB PM A. SILVA", rank: "CB", extras: 0, platoon: "ALFA" },
      
      // Cabos - Guarnição BRAVO
      { name: "CB PM BRASIL", rank: "CB", extras: 0, platoon: "BRAVO" },
      
      // Cabos - Guarnição CHARLIE
      { name: "CB PM MIQUEIAS", rank: "CB", extras: 0, platoon: "CHARLIE" },
      { name: "CB PM M. PAIXÃO", rank: "CB", extras: 0, platoon: "CHARLIE" },
      
      // Cabos - FÉRIAS (mantendo no sistema como BRAVO)
      { name: "CB PM ALAX", rank: "CB", extras: 0, platoon: "BRAVO" },
      { name: "CB PM VELOSO", rank: "CB", extras: 0, platoon: "BRAVO" },
      
      // Cabos - EXPEDIENTE
      { name: "CB PM TONI", rank: "CB", extras: 0, platoon: "EXPEDIENTE" },
      
      // Soldados - Guarnição ALFA
      { name: "SD PM LUAN", rank: "SD", extras: 0, platoon: "ALFA" },
      { name: "SD PM NAVARRO", rank: "SD", extras: 0, platoon: "ALFA" },
      
      // Soldados - Guarnição BRAVO
      { name: "SD PM MARVÃO", rank: "SD", extras: 0, platoon: "BRAVO" },
      { name: "SD PM IDELVAN", rank: "SD", extras: 0, platoon: "BRAVO" },
      
      // Soldados - Guarnição CHARLIE
      { name: "SD PM CHAGAS", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM CARVALHO", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM GOVEIA", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM ALMEIDA", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM PATRIK", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM GUIMARÃES", rank: "SD", extras: 0, platoon: "CHARLIE" },
      
      // Soldados - EXPEDIENTE
      { name: "SD PM S. CORREA", rank: "SD", extras: 0, platoon: "EXPEDIENTE" },
      { name: "SD PM RODRIGUES", rank: "SD", extras: 0, platoon: "EXPEDIENTE" }
    ];
    
    try {
      // Inserir todos os registros usando uma transação
      await db.transaction(async (tx) => {
        await tx.insert(personnel).values(samplePersonnel);
      });
      
      console.log("[DB] Inicialização concluída com sucesso.");
    } catch (error) {
      console.error("[DB] Erro ao inserir dados iniciais:", error);
      throw error;
    }
  } catch (error) {
    console.error("[DB] Erro ao inicializar o banco de dados:", error);
    throw error;
  }
}

// Função para verificar e corrigir possíveis inconsistências no banco
export async function validateDatabaseIntegrity() {
  try {
    console.log("[DB] Verificando integridade do banco de dados...");
    
    // Verificar se há registros de assignments referenciando personnel inexistentes
    const invalidAssignments = await db.execute(sql`
      SELECT a.id FROM assignments a 
      LEFT JOIN personnel p ON a.personnel_id = p.id
      WHERE p.id IS NULL
    `);
    
    if (invalidAssignments.rows && invalidAssignments.rows.length > 0) {
      console.log(`[DB] Encontrados ${invalidAssignments.rows.length} assignments inválidos. Corrigindo...`);
      
      // Recuperar IDs dos assignments inválidos
      const invalidIds = invalidAssignments.rows.map(row => row.id);
      
      // Remover assignments inválidos
      if (invalidIds.length > 0) {
        // Excluir um por um para evitar problemas com o SQL dinâmico
        for (const id of invalidIds) {
          await db.execute(sql`DELETE FROM assignments WHERE id = ${id}`);
        }
        console.log(`[DB] ${invalidIds.length} assignments inválidos removidos com sucesso.`);
      }
    } else {
      console.log("[DB] Nenhum problema de integridade encontrado nos assignments.");
    }
    
    console.log("[DB] Verificação de integridade concluída.");
    return true;
  } catch (error) {
    console.error("[DB] Erro ao verificar integridade do banco:", error);
    return false;
  }
}