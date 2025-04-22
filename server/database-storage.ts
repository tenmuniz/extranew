import { 
  personnel, 
  assignments, 
  type Personnel, 
  type InsertPersonnel, 
  type Assignment, 
  type InsertAssignment,
  type OperationType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Personnel methods
  async getAllPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel);
  }

  async getPersonnel(id: number): Promise<Personnel | undefined> {
    const results = await db.select().from(personnel).where(eq(personnel.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    // Garantir que extras sempre tenha um valor numérico
    const extras = data.extras !== undefined ? data.extras : 0;
    // Garantir que platoon sempre tenha um valor da enum
    const platoon = data.platoon || "EXPEDIENTE";
    
    const [newPersonnel] = await db.insert(personnel)
      .values({ ...data, extras, platoon })
      .returning();
      
    return newPersonnel;
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const existingPersonnel = await this.getPersonnel(id);
    if (!existingPersonnel) return undefined;

    // Verificar se há algo para atualizar
    if (Object.keys(data).length === 0) return existingPersonnel;

    // Garantir que extras tenha um valor numérico válido
    let updatedData = { ...data };
    if (updatedData.extras === undefined && data.extras !== 0) {
      updatedData.extras = existingPersonnel.extras;
    }
    
    // Garantir que platoon mantenha um valor válido
    if (updatedData.platoon === undefined) {
      updatedData.platoon = existingPersonnel.platoon;
    }

    const [updatedPersonnel] = await db.update(personnel)
      .set(updatedData)
      .where(eq(personnel.id, id))
      .returning();
    
    return updatedPersonnel;
  }

  async deletePersonnel(id: number): Promise<boolean> {
    try {
      // Cascade delete será tratado pela constraint definida no schema
      const result = await db.delete(personnel)
        .where(eq(personnel.id, id))
        .returning({ id: personnel.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting personnel:", error);
      return false;
    }
  }

  // Assignment methods
  async getAllAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments);
  }
  
  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Converter para formato ISO de data para o Postgres
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    return await db.select()
      .from(assignments)
      .where(and(
        gte(assignments.date, startStr),
        lte(assignments.date, endStr)
      ));
  }

  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Converter para formato ISO de data para o Postgres
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Postgres compara datas por data, ignorando horas
    return await db.select()
      .from(assignments)
      .where(eq(assignments.date, dateStr));
  }

  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments)
      .values(data)
      .returning();
    
    return newAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      const result = await db.delete(assignments)
        .where(eq(assignments.id, id))
        .returning({ id: assignments.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return false;
    }
  }

  async getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Converter para formato ISO de data para o Postgres
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Primeiro obter todas as designações para o dia e tipo de operação
    const assignmentsForDay = await db.select()
      .from(assignments)
      .where(and(
        eq(assignments.date, dateStr),
        eq(assignments.operationType, operationType)
      ));
    
    // Retornar o comprimento do array
    return assignmentsForDay.length;
  }
}