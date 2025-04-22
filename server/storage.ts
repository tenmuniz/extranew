import { 
  type Personnel, 
  type InsertPersonnel, 
  type Assignment, 
  type InsertAssignment,
  type OperationType
} from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Caminhos para os arquivos de dados
const DATA_DIR = path.join(process.cwd(), 'data');
const PERSONNEL_FILE = path.join(DATA_DIR, 'personnel.json');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');

// Interface for storage operations
export interface IStorage {
  // Personnel operations
  getAllPersonnel(): Promise<Personnel[]>;
  getPersonnel(id: number): Promise<Personnel | undefined>;
  createPersonnel(data: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined>;
  deletePersonnel(id: number): Promise<boolean>;
  
  // Assignment operations
  getAllAssignments(): Promise<Assignment[]>;
  getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]>;
  getAssignmentsByDate(date: Date): Promise<Assignment[]>;
  createAssignment(data: InsertAssignment): Promise<Assignment>;
  deleteAssignment(id: number): Promise<boolean>;
  getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number>;
}

// Class for in-memory storage with file persistence
export class MemStorage implements IStorage {
  // Método privado para garantir que o diretório de dados existe
  private ensureDataDirExists(): void {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log(`[MemStorage] Diretório de dados criado: ${DATA_DIR}`);
      } catch (err) {
        console.error(`[MemStorage] Erro ao criar diretório de dados: ${err}`);
      }
    }
  }
  
  // Método para salvar dados de pessoal em arquivo
  private savePersonnelToFile(): void {
    this.ensureDataDirExists();
    try {
      fs.writeFileSync(PERSONNEL_FILE, JSON.stringify(this.personnel, null, 2));
      console.log(`[MemStorage] Dados de pessoal salvos em ${PERSONNEL_FILE}`);
    } catch (err) {
      console.error(`[MemStorage] Erro ao salvar dados de pessoal: ${err}`);
    }
  }
  
  // Método para salvar atribuições em arquivo
  private saveAssignmentsToFile(): void {
    this.ensureDataDirExists();
    try {
      fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(this.assignments, null, 2));
      console.log(`[MemStorage] Atribuições salvas em ${ASSIGNMENTS_FILE}`);
    } catch (err) {
      console.error(`[MemStorage] Erro ao salvar atribuições: ${err}`);
    }
  }
  
  // Método para carregar dados de pessoal do arquivo
  private loadPersonnelFromFile(): void {
    try {
      if (fs.existsSync(PERSONNEL_FILE)) {
        const data = fs.readFileSync(PERSONNEL_FILE, 'utf8');
        const loadedPersonnel = JSON.parse(data) as Personnel[];
        
        if (Array.isArray(loadedPersonnel) && loadedPersonnel.length > 0) {
          this.personnel = loadedPersonnel;
          
          // Atualizar o último ID de pessoal
          this.lastPersonnelId = Math.max(...this.personnel.map(p => p.id));
          console.log(`[MemStorage] Dados de pessoal carregados de ${PERSONNEL_FILE}`);
          console.log(`[MemStorage] Último ID de pessoal: ${this.lastPersonnelId}`);
        }
      }
    } catch (err) {
      console.error(`[MemStorage] Erro ao carregar dados de pessoal: ${err}`);
    }
  }
  
  // Método para carregar atribuições do arquivo
  private loadAssignmentsFromFile(): void {
    try {
      if (fs.existsSync(ASSIGNMENTS_FILE)) {
        const data = fs.readFileSync(ASSIGNMENTS_FILE, 'utf8');
        const loadedAssignments = JSON.parse(data) as Assignment[];
        
        if (Array.isArray(loadedAssignments) && loadedAssignments.length > 0) {
          this.assignments = loadedAssignments;
          
          // Atualizar o último ID de atribuição
          this.lastAssignmentId = Math.max(...this.assignments.map(a => a.id));
          console.log(`[MemStorage] Atribuições carregadas de ${ASSIGNMENTS_FILE}`);
          console.log(`[MemStorage] Último ID de atribuição: ${this.lastAssignmentId}`);
        }
      }
    } catch (err) {
      console.error(`[MemStorage] Erro ao carregar atribuições: ${err}`);
    }
  }
  
  constructor() {
    // Carregar dados dos arquivos quando a classe é inicializada
    this.loadPersonnelFromFile();
    this.loadAssignmentsFromFile();
  }
  private personnel: Personnel[] = [
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
  
  private assignments: Assignment[] = [];
  private lastAssignmentId = 0;
  private lastPersonnelId = 42; // começa com o último ID na lista acima
  // Personnel methods
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
    const index = this.personnel.findIndex(p => p.id === id);
    if (index === -1) {
      console.warn(`[MemStorage] Nenhum funcionário encontrado com ID ${id}`);
      return undefined;
    }
    
    const updatedPerson = {
      ...this.personnel[index],
      ...data
    };
    
    this.personnel[index] = updatedPerson;
    console.log(`[MemStorage] Funcionário atualizado com sucesso: ID=${id}`);
    
    // Salvar dados atualizados
    this.savePersonnelToFile();
    
    return updatedPerson;
  }
  
  async deletePersonnel(id: number): Promise<boolean> {
    const initialLength = this.personnel.length;
    this.personnel = this.personnel.filter(p => p.id !== id);
    
    // Remover também todas as atribuições relacionadas a este funcionário
    const hadAssignments = this.assignments.some(a => a.personnelId === id);
    this.assignments = this.assignments.filter(a => a.personnelId !== id);
    
    const success = this.personnel.length < initialLength;
    if (success) {
      console.log(`[MemStorage] Funcionário excluído com sucesso: ID=${id}`);
      
      // Salvar dados atualizados
      this.savePersonnelToFile();
      
      // Se havia atribuições para esse funcionário, salvar também as atribuições
      if (hadAssignments) {
        this.saveAssignmentsToFile();
      }
    } else {
      console.warn(`[MemStorage] Nenhum funcionário encontrado com ID ${id}`);
    }
    
    return success;
  }
  
  // Assignment methods
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
    const newAssignment: Assignment = {
      id: this.lastAssignmentId,
      personnelId: data.personnelId,
      operationType: data.operationType,
      date: dateStr,
      createdAt: new Date().toISOString()
    };
    
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

// Export an instance of the in-memory storage 
export const storage = new MemStorage();