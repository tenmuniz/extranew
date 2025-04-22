import { db } from "./db";
import { personnel, assignments } from "@shared/schema";
import { sql } from "drizzle-orm";
import { DatabaseStorage } from "./database-storage";

// Função para inicializar o banco de dados
export async function initializeDatabase(): Promise<void> {
  try {
    // Verificar se as tabelas existem
    const tableExists = await checkTablesExist();
    
    if (!tableExists) {
      console.log("Inicializando banco de dados...");
      
      // Criar tabelas
      await createTables();
      
      // Inserir dados iniciais
      await seedInitialData();
      
      console.log("Banco de dados inicializado com sucesso!");
    } else {
      console.log("Banco de dados já está inicializado.");
    }
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
    throw error;
  }
}

// Verificar se as tabelas já existem
async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'personnel'
      );
    `);
    
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error("Erro ao verificar tabelas:", error);
    return false;
  }
}

// Criar as tabelas no banco de dados
async function createTables(): Promise<void> {
  try {
    // Criar tabela de personnel
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS personnel (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rank TEXT NOT NULL,
        extras INTEGER NOT NULL DEFAULT 0,
        platoon TEXT NOT NULL DEFAULT 'EXPEDIENTE'
      );
    `);
    
    // Criar tabela de assignments
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
        operation_type TEXT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("Tabelas criadas com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    throw error;
  }
}

// Inserir dados iniciais
async function seedInitialData(): Promise<void> {
  try {
    const dbStorage = new DatabaseStorage();
    
    // Inserir pessoal militar com tipagem explícita para garantir conformidade
    const samplePersonnel: {
      name: string; 
      rank: "SD" | "CB" | "3SGT" | "2SGT" | "1SGT" | "SUBTEN" | "TEN" | "1TEN" | "CAP"; 
      extras: number; 
      platoon: "ALFA" | "BRAVO" | "CHARLIE" | "EXPEDIENTE";
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
    
    for (const person of samplePersonnel) {
      await dbStorage.createPersonnel(person);
    }
    
    console.log(`Inseridos ${samplePersonnel.length} registros de pessoal`);
  } catch (error) {
    console.error("Erro ao inserir dados iniciais:", error);
    throw error;
  }
}