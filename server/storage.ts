import { 
  type Personnel, 
  type InsertPersonnel, 
  type Assignment, 
  type InsertAssignment,
  type OperationType
} from "@shared/schema";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

// Interface para operações de armazenamento
export interface IStorage {
  // Operações de pessoal (Personnel)
  getAllPersonnel(): Promise<Personnel[]>;
  getPersonnel(id: number): Promise<Personnel | undefined>;
  createPersonnel(data: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined>;
  deletePersonnel(id: number): Promise<boolean>;
  
  // Operações de atribuição (Assignment)
  getAllAssignments(): Promise<Assignment[]>;
  getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]>;
  getAssignmentsByDate(date: Date): Promise<Assignment[]>;
  createAssignment(data: InsertAssignment): Promise<Assignment>;
  deleteAssignment(id: number): Promise<boolean>;
  getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number>;
}

// Classe para armazenamento em memória com persistência em arquivo
export class MemStorage implements IStorage {
  // Dados em memória
  private personnel: Personnel[] = [];
  private assignments: Assignment[] = [];
  private lastPersonnelId = 0;
  private lastAssignmentId = 0;

  // Métodos auxiliares para salvar/carregar dados
  private ensureDataDirExists(): void {
    if (!existsSync('data')) {
      mkdirSync('data', { recursive: true });
    }
  }

  private savePersonnelToFile(): void {
    this.ensureDataDirExists();
    try {
      writeFileSync('data/personnel.json', JSON.stringify(this.personnel, null, 2));
    } catch (error) {
      console.error(`[MemStorage] Erro ao salvar dados de pessoal:`, error);
    }
  }
  
  private saveAssignmentsToFile(): void {
    this.ensureDataDirExists();
    try {
      writeFileSync('data/assignments.json', JSON.stringify(this.assignments, null, 2));
    } catch (error) {
      console.error(`[MemStorage] Erro ao salvar atribuições:`, error);
    }
  }
  
  private loadPersonnelFromFile(): void {
    try {
      this.ensureDataDirExists();
      if (existsSync('data/personnel.json')) {
        const data = readFileSync('data/personnel.json', 'utf8');
        const parsedData = JSON.parse(data) as Personnel[];
        
        if (Array.isArray(parsedData)) {
          this.personnel = parsedData;
          // Atualizar lastPersonnelId com o maior ID encontrado
          if (this.personnel.length > 0) {
            this.lastPersonnelId = Math.max(...this.personnel.map(p => p.id));
          }
          console.log(`[MemStorage] Dados de pessoal carregados de data/personnel.json`);
          console.log(`[MemStorage] Último ID de pessoal: ${this.lastPersonnelId}`);
        }
      }
    } catch (error) {
      console.error(`[MemStorage] Erro ao carregar dados de pessoal:`, error);
      // Em caso de erro, inicializar com dados padrão
      this.initializeDefaultPersonnel();
    }
  }
  
  private loadAssignmentsFromFile(): void {
    try {
      this.ensureDataDirExists();
      if (existsSync('data/assignments.json')) {
        const data = readFileSync('data/assignments.json', 'utf8');
        const parsedData = JSON.parse(data) as Assignment[];
        
        if (Array.isArray(parsedData)) {
          this.assignments = parsedData;
          // Atualizar lastAssignmentId com o maior ID encontrado
          if (this.assignments.length > 0) {
            this.lastAssignmentId = Math.max(...this.assignments.map(a => a.id));
          }
          console.log(`[MemStorage] Atribuições carregadas de data/assignments.json`);
          console.log(`[MemStorage] Último ID de atribuição: ${this.lastAssignmentId}`);
        }
      }
    } catch (error) {
      console.error(`[MemStorage] Erro ao carregar atribuições:`, error);
      // Em caso de erro, inicializar com um array vazio
      this.assignments = [];
    }
  }

  // Inicializar dados padrão de pessoal caso o arquivo não exista
  private initializeDefaultPersonnel(): void {
    this.personnel = [
      // Capitão e oficiais primeiro (por ordem hierárquica - EXPEDIENTE)
      { id: 1, name: "CAP MUNIZ", rank: "CAP", extras: 0, platoon: "EXPEDIENTE" },
      { id: 2, name: "1º TEN QOPM MONTEIRO", rank: "1TEN", extras: 0, platoon: "EXPEDIENTE" },
      { id: 3, name: "TEN VANILSON", rank: "TEN", extras: 0, platoon: "EXPEDIENTE" },
      { id: 4, name: "SUB TEN ANDRÉ", rank: "SUBTEN", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição BRAVO 
      { id: 5, name: "1º SGT PM OLIMAR", rank: "1SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição ALFA
      { id: 6, name: "2º SGT PM PEIXOTO", rank: "2SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { id: 7, name: "2º SGT PM FÁBIO", rank: "2SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { id: 8, name: "2º SGT PM PINHEIRO", rank: "2SGT", extras: 0, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { id: 9, name: "2º SGT PM A. TAVARES", rank: "2SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição ALFA
      { id: 10, name: "3º SGT PM RODRIGO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { id: 11, name: "3º SGT PM LEDO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { id: 12, name: "3º SGT PM NUNES", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { id: 13, name: "3º SGT PM AMARAL", rank: "3SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { id: 14, name: "3º SGT PM ANA CLEIDE", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { id: 15, name: "3º SGT PM GLEIDSON", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { id: 16, name: "3º SGT PM CARLOS EDUARDO", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      { id: 17, name: "3º SGT PM NEGRÃO", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { id: 18, name: "3º SGT PM RAFAEL", rank: "3SGT", extras: 0, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { id: 19, name: "3º SGT PM CUNHA", rank: "3SGT", extras: 0, platoon: "EXPEDIENTE" },
      { id: 20, name: "3º SGT PM CARAVELAS", rank: "3SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Cabos - Guarnição ALFA
      { id: 21, name: "CB PM CARLA", rank: "CB", extras: 0, platoon: "ALFA" },
      { id: 22, name: "CB PM FELIPE", rank: "CB", extras: 0, platoon: "ALFA" },
      { id: 23, name: "CB PM BARROS", rank: "CB", extras: 0, platoon: "ALFA" },
      { id: 24, name: "CB PM A. SILVA", rank: "CB", extras: 0, platoon: "ALFA" },
      
      // Cabos - Guarnição BRAVO
      { id: 25, name: "CB PM BRASIL", rank: "CB", extras: 0, platoon: "BRAVO" },
      
      // Cabos - Guarnição CHARLIE
      { id: 26, name: "CB PM MIQUEIAS", rank: "CB", extras: 0, platoon: "CHARLIE" },
      { id: 27, name: "CB PM M. PAIXÃO", rank: "CB", extras: 0, platoon: "CHARLIE" },
      
      // Cabos - FÉRIAS (mantendo no sistema como BRAVO)
      { id: 28, name: "CB PM ALAX", rank: "CB", extras: 0, platoon: "BRAVO" },
      { id: 29, name: "CB PM VELOSO", rank: "CB", extras: 0, platoon: "BRAVO" },
      
      // Cabos - EXPEDIENTE
      { id: 30, name: "CB PM TONI", rank: "CB", extras: 0, platoon: "EXPEDIENTE" },
      
      // Soldados - Guarnição ALFA
      { id: 31, name: "SD PM LUAN", rank: "SD", extras: 0, platoon: "ALFA" },
      { id: 32, name: "SD PM NAVARRO", rank: "SD", extras: 0, platoon: "ALFA" },
      
      // Soldados - Guarnição BRAVO
      { id: 33, name: "SD PM MARVÃO", rank: "SD", extras: 0, platoon: "BRAVO" },
      { id: 34, name: "SD PM IDELVAN", rank: "SD", extras: 0, platoon: "BRAVO" },
      
      // Soldados - Guarnição CHARLIE
      { id: 35, name: "SD PM CHAGAS", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { id: 36, name: "SD PM CARVALHO", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { id: 37, name: "SD PM GOVEIA", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { id: 38, name: "SD PM ALMEIDA", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { id: 39, name: "SD PM PATRIK", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { id: 40, name: "SD PM GUIMARÃES", rank: "SD", extras: 0, platoon: "CHARLIE" },
      
      // Soldados - EXPEDIENTE
      { id: 41, name: "SD PM S. CORREA", rank: "SD", extras: 0, platoon: "EXPEDIENTE" },
      { id: 42, name: "SD PM RODRIGUES", rank: "SD", extras: 0, platoon: "EXPEDIENTE" }
    ];
    
    // Definir o último ID como 42 (o maior da lista acima)
    this.lastPersonnelId = 42;
  }

  constructor() {
    // Inicializar dados
    this.personnel = [];
    this.assignments = [];
    this.lastPersonnelId = 0;
    this.lastAssignmentId = 0;
    
    // Carregar dados do arquivo quando a classe é inicializada
    this.loadPersonnelFromFile();
    this.loadAssignmentsFromFile();
  }

  // Métodos para operações com pessoal (Personnel)
  async getAllPersonnel(): Promise<Personnel[]> {
    console.log("[MemStorage] Buscando todos os funcionários");
    return [...this.personnel];
  }
  
  async getPersonnel(id: number): Promise<Personnel | undefined> {
    return this.personnel.find(p => p.id === id);
  }
  
  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    this.lastPersonnelId++;
    const newPerson: Personnel = {
      id: this.lastPersonnelId,
      name: data.name,
      rank: data.rank,
      extras: data.extras !== undefined ? data.extras : 0,
      platoon: data.platoon || "EXPEDIENTE"
    };
    this.personnel.push(newPerson);
    console.log(`[MemStorage] Funcionário criado com sucesso: ID=${newPerson.id}`);
    
    // Salvar dados atualizados
    this.savePersonnelToFile();
    
    return newPerson;
  }
  
  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    // Encontrar o índice do funcionário no array
    const index = this.personnel.findIndex(p => p.id === id);
    if (index === -1) {
      console.warn(`[MemStorage] Nenhum funcionário encontrado com ID ${id}`);
      return undefined;
    }
    
    // Criar uma cópia do objeto atual e mesclar com os novos dados
    const updatedPerson: Personnel = {
      ...this.personnel[index],
      ...data
    };
    
    // Atualizar o objeto no array
    this.personnel[index] = updatedPerson;
    console.log(`[MemStorage] Funcionário atualizado com sucesso: ID=${id}`);
    
    // Salvar dados atualizados
    this.savePersonnelToFile();
    
    return updatedPerson;
  }
  
  async deletePersonnel(id: number): Promise<boolean> {
    const initialLength = this.personnel.length;
    
    // Verificar se existem atribuições para este funcionário
    const hasAssignments = this.assignments.some(a => a.personnelId === id);
    if (hasAssignments) {
      console.warn(`[MemStorage] Não é possível excluir funcionário ID=${id} pois existem atribuições relacionadas`);
      return false;
    }
    
    // Remover o funcionário do array
    this.personnel = this.personnel.filter(p => p.id !== id);
    
    const success = this.personnel.length < initialLength;
    if (success) {
      console.log(`[MemStorage] Funcionário excluído com sucesso: ID=${id}`);
      
      // Salvar dados atualizados
      this.savePersonnelToFile();
    } else {
      console.warn(`[MemStorage] Nenhum funcionário encontrado com ID ${id}`);
    }
    
    return success;
  }
  
  // Métodos para operações com atribuições (Assignment)
  async getAllAssignments(): Promise<Assignment[]> {
    console.log("[MemStorage] Buscando todas as atribuições");
    return [...this.assignments];
  }
  
  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]> {
    console.log(`[MemStorage] Buscando atribuições entre ${startDate.toISOString()} e ${endDate.toISOString()}`);
    
    // Formatação de datas para comparação
    const startStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return this.assignments.filter(a => {
      // Garantir que estamos comparando apenas a parte da data
      const assignmentDateStr = typeof a.date === 'string' ? 
        a.date.includes('T') ? a.date.split('T')[0] : a.date : 
        new Date(a.date).toISOString().split('T')[0];
      
      return assignmentDateStr >= startStr && assignmentDateStr <= endStr;
    });
  }
  
  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    // Formatação de data para comparação (YYYY-MM-DD)
    const targetDateStr = date.toISOString().split('T')[0];
    
    console.log(`[MemStorage] Buscando atribuições para ${targetDateStr}`);
    
    return this.assignments.filter(a => {
      // Garantir que estamos comparando apenas a parte da data
      const assignmentDateStr = typeof a.date === 'string' ? 
        a.date.includes('T') ? a.date.split('T')[0] : a.date : 
        new Date(a.date).toISOString().split('T')[0];
      
      return assignmentDateStr === targetDateStr;
    });
  }
  
  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    // Validar que personnel_id existe
    const personExists = this.personnel.some(p => p.id === data.personnelId);
    if (!personExists) {
      throw new Error(`Funcionário com ID ${data.personnelId} não encontrado`);
    }
    
    this.lastAssignmentId++;
    
    // Garantir formato correto da data (YYYY-MM-DD)
    const dateStr = typeof data.date === 'string' ? 
      (data.date.includes('T') ? data.date.split('T')[0] : data.date) : 
      new Date(data.date).toISOString().split('T')[0];
    
    // Criar objeto de atribuição
    const newAssignment = {
      id: this.lastAssignmentId,
      personnelId: data.personnelId,
      operationType: data.operationType,
      date: dateStr,
      createdAt: new Date()
    } as Assignment;
    
    this.assignments.push(newAssignment);
    console.log(`[MemStorage] Atribuição criada com sucesso: ID=${newAssignment.id}`);
    
    // Salvar dados atualizados
    this.saveAssignmentsToFile();
    
    return newAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    const initialLength = this.assignments.length;
    this.assignments = this.assignments.filter(a => a.id !== id);
    
    const success = this.assignments.length < initialLength;
    if (success) {
      console.log(`[MemStorage] Atribuição excluída com sucesso: ID=${id}`);
      
      // Salvar dados atualizados
      this.saveAssignmentsToFile();
    } else {
      console.warn(`[MemStorage] Nenhuma atribuição encontrada com ID ${id}`);
    }
    
    return success;
  }
  
  async getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number> {
    // Formatação de data para comparação (YYYY-MM-DD)
    const targetDateStr = date.toISOString().split('T')[0];
    
    const count = this.assignments.filter(a => {
      // Garantir que estamos comparando apenas a parte da data
      const assignmentDateStr = typeof a.date === 'string' ? 
        a.date.includes('T') ? a.date.split('T')[0] : a.date : 
        new Date(a.date).toISOString().split('T')[0];
      
      return assignmentDateStr === targetDateStr && a.operationType === operationType;
    }).length;
    
    return count;
  }

}

// Exportar uma instância do armazenamento em memória
export const storage = new MemStorage();