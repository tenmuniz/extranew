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
      { name: "Cabo Silva", rank: "CB", registrationNumber: "12345" },
      { name: "Soldado Oliveira", rank: "SD", registrationNumber: "23456" },
      { name: "Tenente Santos", rank: "TN", registrationNumber: "34567" },
      { name: "Cabo Pereira", rank: "CB", registrationNumber: "45678" },
      { name: "Soldado Ferreira", rank: "SD", registrationNumber: "56789" },
      { name: "Sargento Costa", rank: "SG", registrationNumber: "67890" },
      { name: "Soldado Martins", rank: "SD", registrationNumber: "78901" },
      { name: "Cabo Almeida", rank: "CB", registrationNumber: "89012" },
      { name: "Capitão Ribeiro", rank: "CP", registrationNumber: "90123" },
      { name: "Soldado Lima", rank: "SD", registrationNumber: "01234" }
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
    const newPersonnel: Personnel = { ...data, id };
    this.personnelData.set(id, newPersonnel);
    return newPersonnel;
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const personnel = this.personnelData.get(id);
    if (!personnel) return undefined;

    const updatedPersonnel: Personnel = {
      ...personnel,
      ...data
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
