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
import { and, eq, gte, lte, sql } from "drizzle-orm";

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

// Class to use PostgreSQL database storage
export class DatabaseStorage implements IStorage {
  // Personnel methods
  async getAllPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel);
  }

  async getPersonnel(id: number): Promise<Personnel | undefined> {
    const result = await db.select().from(personnel).where(eq(personnel.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    const [result] = await db.insert(personnel).values({
      name: data.name,
      rank: data.rank,
      extras: data.extras !== undefined ? data.extras : 0,
      platoon: data.platoon || "EXPEDIENTE"
    }).returning();
    
    return result;
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const [result] = await db.update(personnel)
      .set(data)
      .where(eq(personnel.id, id))
      .returning();
    
    return result;
  }

  async deletePersonnel(id: number): Promise<boolean> {
    // As a cascading delete is defined on the table, we don't need to 
    // manually delete related assignments
    const result = await db.delete(personnel)
      .where(eq(personnel.id, id))
      .returning({ id: personnel.id });
    
    return result.length > 0;
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
    
    return await db.select()
      .from(assignments)
      .where(
        and(
          sql`${assignments.date} >= ${start.toISOString()}`,
          sql`${assignments.date} <= ${end.toISOString()}`
        )
      );
  }

  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Set end of day for the same date
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    return await db.select()
      .from(assignments)
      .where(
        and(
          sql`${assignments.date} >= ${targetDate.toISOString()}`,
          sql`${assignments.date} <= ${endDate.toISOString()}`
        )
      );
  }

  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    const [result] = await db.insert(assignments)
      .values({
        personnelId: data.personnelId,
        operationType: data.operationType,
        date: data.date
      })
      .returning();
    
    return result;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments)
      .where(eq(assignments.id, id))
      .returning({ id: assignments.id });
    
    return result.length > 0;
  }

  async getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Set end of day for the same date
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    const result = await db.select()
      .from(assignments)
      .where(
        and(
          sql`${assignments.date} >= ${targetDate.toISOString()}`,
          sql`${assignments.date} <= ${endDate.toISOString()}`,
          eq(assignments.operationType, operationType)
        )
      );
    
    return result.length;
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();