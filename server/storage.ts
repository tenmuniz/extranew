import { 
  personnel, 
  assignments, 
  type Personnel, 
  type InsertPersonnel, 
  type Assignment, 
  type InsertAssignment,
  type OperationType
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Personnel operations
  getAllPersonnel(): Promise<Personnel[]>;
  getPersonnel(id: number): Promise<Personnel | undefined>;
  createPersonnel(data: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined>;
  deletePersonnel(id: number): Promise<boolean>;
  
  // Assignment operations
  getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]>;
  getAssignmentsByDate(date: Date): Promise<Assignment[]>;
  createAssignment(data: InsertAssignment): Promise<Assignment>;
  deleteAssignment(id: number): Promise<boolean>;
  getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number>;
}

export class MemStorage implements IStorage {
  private personnelData: Map<number, Personnel>;
  private assignmentsData: Map<number, Assignment>;
  private personnelCurrentId: number;
  private assignmentsCurrentId: number;

  constructor() {
    this.personnelData = new Map();
    this.assignmentsData = new Map();
    this.personnelCurrentId = 1;
    this.assignmentsCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samplePersonnel: InsertPersonnel[] = [
      // Capitão e oficiais primeiro (por ordem hierárquica - EXPEDIENTE)
      { name: "CAP MUNIZ", rank: "CAP", extras: 0, platoon: "EXPEDIENTE" },
      { name: "1º TEN QOPM MONTEIRO", rank: "1TEN", extras: 0, platoon: "EXPEDIENTE" },
      { name: "TEN VANILSON", rank: "TEN", extras: 0, platoon: "EXPEDIENTE" },
      { name: "SUB TEN ANDRÉ", rank: "SUBTEN", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição BRAVO 
      { name: "1º SGT PM OLIMAR", rank: "1SGT", extras: 2, platoon: "BRAVO" },
      
      // Sargentos - Guarnição ALFA
      { name: "2º SGT PM PEIXOTO", rank: "2SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { name: "2º SGT PM FÁBIO", rank: "2SGT", extras: 1, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { name: "2º SGT PM PINHEIRO", rank: "2SGT", extras: 3, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { name: "2º SGT PM A. TAVARES", rank: "2SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Sargentos - Guarnição ALFA
      { name: "3º SGT PM RODRIGO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM LEDO", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM NUNES", rank: "3SGT", extras: 0, platoon: "ALFA" },
      { name: "3º SGT PM AMARAL", rank: "3SGT", extras: 0, platoon: "ALFA" },
      
      // Sargentos - Guarnição BRAVO
      { name: "3º SGT PM ANA CLEIDE", rank: "3SGT", extras: 2, platoon: "BRAVO" },
      { name: "3º SGT PM GLEIDSON", rank: "3SGT", extras: 1, platoon: "BRAVO" },
      { name: "3º SGT PM CARLOS EDUARDO", rank: "3SGT", extras: 3, platoon: "BRAVO" },
      { name: "3º SGT PM NEGRÃO", rank: "3SGT", extras: 0, platoon: "BRAVO" },
      
      // Sargentos - Guarnição CHARLIE
      { name: "3º SGT PM RAFAEL", rank: "3SGT", extras: 2, platoon: "CHARLIE" },
      
      // Sargentos - EXPEDIENTE
      { name: "3º SGT PM CUNHA", rank: "3SGT", extras: 1, platoon: "EXPEDIENTE" },
      { name: "3º SGT PM CARAVELAS", rank: "3SGT", extras: 0, platoon: "EXPEDIENTE" },
      
      // Cabos - Guarnição ALFA
      { name: "CB PM CARLA", rank: "CB", extras: 0, platoon: "ALFA" },
      { name: "CB PM FELIPE", rank: "CB", extras: 0, platoon: "ALFA" },
      { name: "CB PM BARROS", rank: "CB", extras: 1, platoon: "ALFA" },
      { name: "CB PM A. SILVA", rank: "CB", extras: 2, platoon: "ALFA" },
      
      // Cabos - Guarnição BRAVO
      { name: "CB PM BRASIL", rank: "CB", extras: 3, platoon: "BRAVO" },
      
      // Cabos - Guarnição CHARLIE
      { name: "CB PM MIQUEIAS", rank: "CB", extras: 0, platoon: "CHARLIE" },
      { name: "CB PM M. PAIXÃO", rank: "CB", extras: 1, platoon: "CHARLIE" },
      
      // Cabos - FÉRIAS (mantendo no sistema como BRAVO)
      { name: "CB PM ALAX", rank: "CB", extras: 2, platoon: "BRAVO" },
      { name: "CB PM VELOSO", rank: "CB", extras: 3, platoon: "BRAVO" },
      
      // Cabos - EXPEDIENTE
      { name: "CB PM TONI", rank: "CB", extras: 0, platoon: "EXPEDIENTE" },
      
      // Soldados - Guarnição ALFA
      { name: "SD PM LUAN", rank: "SD", extras: 0, platoon: "ALFA" },
      { name: "SD PM NAVARRO", rank: "SD", extras: 1, platoon: "ALFA" },
      
      // Soldados - Guarnição BRAVO
      { name: "SD PM MARVÃO", rank: "SD", extras: 2, platoon: "BRAVO" },
      { name: "SD PM IDELVAN", rank: "SD", extras: 0, platoon: "BRAVO" },
      
      // Soldados - Guarnição CHARLIE
      { name: "SD PM CHAGAS", rank: "SD", extras: 3, platoon: "CHARLIE" },
      { name: "SD PM CARVALHO", rank: "SD", extras: 1, platoon: "CHARLIE" },
      { name: "SD PM GOVEIA", rank: "SD", extras: 0, platoon: "CHARLIE" },
      { name: "SD PM ALMEIDA", rank: "SD", extras: 2, platoon: "CHARLIE" },
      { name: "SD PM PATRIK", rank: "SD", extras: 1, platoon: "CHARLIE" },
      { name: "SD PM GUIMARÃES", rank: "SD", extras: 3, platoon: "CHARLIE" },
      
      // Soldados - EXPEDIENTE
      { name: "SD PM S. CORREA", rank: "SD", extras: 0, platoon: "EXPEDIENTE" },
      { name: "SD PM RODRIGUES", rank: "SD", extras: 1, platoon: "EXPEDIENTE" }
    ];

    samplePersonnel.forEach(person => {
      this.createPersonnel(person);
    });
  }

  // Personnel methods
  async getAllPersonnel(): Promise<Personnel[]> {
    return Array.from(this.personnelData.values());
  }

  async getPersonnel(id: number): Promise<Personnel | undefined> {
    return this.personnelData.get(id);
  }

  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    const id = this.personnelCurrentId++;
    // Garantir que extras sempre tenha um valor numérico
    const extras = data.extras !== undefined ? data.extras : 0;
    // Garantir que platoon sempre tenha um valor da enum
    const platoon = data.platoon || "EXPEDIENTE";
    
    const newPersonnel: Personnel = { 
      ...data, 
      id,
      extras,
      platoon 
    };
    this.personnelData.set(id, newPersonnel);
    return newPersonnel;
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const personnel = this.personnelData.get(id);
    if (!personnel) return undefined;

    // Garantir que extras sempre tenha um valor numérico
    let updatedData = { ...data };
    if (updatedData.extras === undefined && data.extras !== 0) {
      updatedData.extras = personnel.extras;
    }
    
    // Garantir que platoon mantenha um valor válido
    if (updatedData.platoon === undefined) {
      updatedData.platoon = personnel.platoon;
    }

    const updatedPersonnel: Personnel = {
      ...personnel,
      ...updatedData
    };

    this.personnelData.set(id, updatedPersonnel);
    return updatedPersonnel;
  }

  async deletePersonnel(id: number): Promise<boolean> {
    // Delete related assignments first
    const assignments = Array.from(this.assignmentsData.values()).filter(
      assignment => assignment.personnelId === id
    );
    
    for (const assignment of assignments) {
      await this.deleteAssignment(assignment.id);
    }
    
    return this.personnelData.delete(id);
  }

  // Assignment methods
  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return Array.from(this.assignmentsData.values()).filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      return assignmentDate >= start && assignmentDate <= end;
    });
  }

  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.assignmentsData.values()).filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate.getTime() === targetDate.getTime();
    });
  }

  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentsCurrentId++;
    const newAssignment: Assignment = { 
      ...data, 
      id, 
      createdAt: new Date() 
    };
    
    this.assignmentsData.set(id, newAssignment);
    return newAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignmentsData.delete(id);
  }

  async getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number> {
    const assignments = await this.getAssignmentsByDate(date);
    return assignments.filter(a => a.operationType === operationType).length;
  }
}

export const storage = new MemStorage();
