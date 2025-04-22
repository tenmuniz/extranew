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
    try {
      return await db.select().from(personnel);
    } catch (error) {
      console.error("Erro ao buscar todos os personnels:", error);
      return [];
    }
  }

  async getPersonnel(id: number): Promise<Personnel | undefined> {
    try {
      const results = await db.select().from(personnel).where(eq(personnel.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Erro ao buscar personnel com ID ${id}:`, error);
      return undefined;
    }
  }

  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    try {
      // Garantir que extras sempre tenha um valor numérico
      const extras = data.extras !== undefined ? data.extras : 0;
      // Garantir que platoon sempre tenha um valor da enum
      const platoon = data.platoon || "EXPEDIENTE";
      
      const [newPersonnel] = await db.insert(personnel)
        .values({ ...data, extras, platoon })
        .returning();
        
      return newPersonnel;
    } catch (error) {
      console.error("Erro ao criar personnel:", error);
      throw error;
    }
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    try {
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
    } catch (error) {
      console.error(`Erro ao atualizar personnel com ID ${id}:`, error);
      return undefined;
    }
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
    try {
      return await db.select().from(assignments);
    } catch (error) {
      console.error("Erro ao buscar todos os assignments:", error);
      return [];
    }
  }
  
  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]> {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Converter para formato ISO de data para o Postgres
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      
      const results = await db.select()
        .from(assignments)
        .where(and(
          gte(assignments.date, startStr),
          lte(assignments.date, endStr)
        ));
      
      return results;
    } catch (error) {
      console.error("Erro ao buscar assignments por intervalo de data:", error);
      return [];
    }
  }

  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Converter para formato ISO de data para o Postgres
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Postgres compara datas por data, ignorando horas
      const results = await db.select()
        .from(assignments)
        .where(eq(assignments.date, dateStr));
        
      return results;
    } catch (error) {
      console.error("Erro ao buscar assignments por data:", error);
      return [];
    }
  }

  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    try {
      const [newAssignment] = await db.insert(assignments)
        .values(data)
        .returning();
      
      return newAssignment;
    } catch (error) {
      console.error("Erro ao criar assignment:", error);
      throw error;
    }
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
    try {
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
    } catch (error) {
      console.error("Erro ao contar assignments para o dia:", error);
      return 0;
    }
  }
}