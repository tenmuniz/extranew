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
    try {
      console.log("[Storage] Buscando todos os funcionários");
      return await db.select().from(personnel);
    } catch (error) {
      console.error("[Storage] Erro ao buscar funcionários:", error);
      return [];
    }
  }

  async getPersonnel(id: number): Promise<Personnel | undefined> {
    try {
      if (!id || isNaN(id)) {
        console.warn("[Storage] ID de funcionário inválido:", id);
        return undefined;
      }
      
      console.log(`[Storage] Buscando funcionário com ID ${id}`);
      const result = await db.select().from(personnel).where(eq(personnel.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`[Storage] Erro ao buscar funcionário com ID ${id}:`, error);
      return undefined;
    }
  }

  async createPersonnel(data: InsertPersonnel): Promise<Personnel> {
    try {
      console.log(`[Storage] Criando novo funcionário: ${data.name}`);
      
      // Usar transação para garantir integridade
      const [result] = await db.transaction(async (tx) => {
        return await tx.insert(personnel).values({
          name: data.name,
          rank: data.rank,
          extras: data.extras !== undefined ? data.extras : 0,
          platoon: data.platoon || "EXPEDIENTE"
        }).returning();
      });
      
      console.log(`[Storage] Funcionário criado com sucesso: ID=${result.id}`);
      return result;
    } catch (error: any) {
      console.error("[Storage] Erro ao criar funcionário:", error);
      throw new Error(`Falha ao criar funcionário: ${error?.message || 'Erro desconhecido'}`);
    }
  }

  async updatePersonnel(id: number, data: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    try {
      if (!id || isNaN(id)) {
        console.warn("[Storage] ID de funcionário inválido para atualização:", id);
        return undefined;
      }
      
      console.log(`[Storage] Atualizando funcionário com ID ${id}`);
      
      // Usar transação para garantir integridade
      const [result] = await db.transaction(async (tx) => {
        return await tx.update(personnel)
          .set(data)
          .where(eq(personnel.id, id))
          .returning();
      });
      
      if (result) {
        console.log(`[Storage] Funcionário atualizado com sucesso: ID=${id}`);
      } else {
        console.warn(`[Storage] Nenhum funcionário encontrado com ID ${id}`);
      }
      
      return result;
    } catch (error) {
      console.error(`[Storage] Erro ao atualizar funcionário com ID ${id}:`, error);
      return undefined;
    }
  }

  async deletePersonnel(id: number): Promise<boolean> {
    try {
      if (!id || isNaN(id)) {
        console.warn("[Storage] ID de funcionário inválido para exclusão:", id);
        return false;
      }
      
      console.log(`[Storage] Excluindo funcionário com ID ${id}`);
      
      // Usar transação para garantir integridade
      const result = await db.transaction(async (tx) => {
        // A cascading delete já está configurada, mas vamos garantir excluindo assignments manualmente
        await tx.delete(assignments).where(eq(assignments.personnelId, id));
        
        // Agora excluir o funcionário
        return await tx.delete(personnel)
          .where(eq(personnel.id, id))
          .returning({ id: personnel.id });
      });
      
      const success = result.length > 0;
      if (success) {
        console.log(`[Storage] Funcionário excluído com sucesso: ID=${id}`);
      } else {
        console.warn(`[Storage] Nenhum funcionário encontrado com ID ${id}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[Storage] Erro ao excluir funcionário com ID ${id}:`, error);
      return false;
    }
  }

  // Assignment methods
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      console.log("[Storage] Buscando todas as atribuições");
      return await db.select().from(assignments);
    } catch (error) {
      console.error("[Storage] Erro ao buscar atribuições:", error);
      return [];
    }
  }
  
  async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<Assignment[]> {
    try {
      // Garantir que as datas estão no formato correto
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Formatação de datas para ISO 8601 para o banco PostgreSQL
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      
      console.log(`[Storage] Buscando assignments de ${startIso} até ${endIso}`);
      
      const result = await db.select()
        .from(assignments)
        .where(
          and(
            sql`${assignments.date} >= ${startIso}`,
            sql`${assignments.date} <= ${endIso}`
          )
        );
      
      return result;
    } catch (error) {
      console.error("[Storage] Erro ao buscar assignments por intervalo de data:", error);
      // Retornar array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  async getAssignmentsByDate(date: Date): Promise<Assignment[]> {
    try {
      // Garantir que a data está no formato correto
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Set end of day for the same date
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Formatação de datas para ISO 8601
      const targetIso = targetDate.toISOString();
      const endIso = endDate.toISOString();
      
      console.log(`[Storage] Buscando assignments para a data ${targetIso}`);
      
      const result = await db.select()
        .from(assignments)
        .where(
          and(
            sql`${assignments.date} >= ${targetIso}`,
            sql`${assignments.date} <= ${endIso}`
          )
        );
      
      return result;
    } catch (error) {
      console.error("[Storage] Erro ao buscar assignments para data específica:", error);
      // Retornar array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  async createAssignment(data: InsertAssignment): Promise<Assignment> {
    try {
      console.log(`[Storage] Criando nova atribuição para funcionário ID=${data.personnelId}, tipo=${data.operationType}, data=${data.date}`);
      
      // Verificar se a data é válida
      if (!(data.date instanceof Date) && isNaN(new Date(data.date).getTime())) {
        throw new Error("Data inválida fornecida para a atribuição");
      }
      
      // Usar transação para garantir integridade
      const [result] = await db.transaction(async (tx) => {
        // Verificar se o personnel existe
        const personnelExists = await tx.select({ id: personnel.id })
          .from(personnel)
          .where(eq(personnel.id, data.personnelId));
          
        if (!personnelExists || personnelExists.length === 0) {
          throw new Error(`Funcionário com ID ${data.personnelId} não encontrado`);
        }
        
        return await tx.insert(assignments)
          .values({
            personnelId: data.personnelId,
            operationType: data.operationType,
            date: data.date
          })
          .returning();
      });
      
      console.log(`[Storage] Atribuição criada com sucesso: ID=${result.id}`);
      return result;
    } catch (error: any) {
      console.error("[Storage] Erro ao criar atribuição:", error);
      throw new Error(`Falha ao criar atribuição: ${error.message}`);
    }
  }

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      if (!id || isNaN(id)) {
        console.warn("[Storage] ID de atribuição inválido para exclusão:", id);
        return false;
      }
      
      console.log(`[Storage] Excluindo atribuição com ID ${id}`);
      
      // Usar transação para garantir integridade
      const result = await db.transaction(async (tx) => {
        return await tx.delete(assignments)
          .where(eq(assignments.id, id))
          .returning({ id: assignments.id });
      });
      
      const success = result.length > 0;
      if (success) {
        console.log(`[Storage] Atribuição excluída com sucesso: ID=${id}`);
      } else {
        console.warn(`[Storage] Nenhuma atribuição encontrada com ID ${id}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[Storage] Erro ao excluir atribuição com ID ${id}:`, error);
      return false;
    }
  }

  async getAssignmentsCountForDay(date: Date, operationType: OperationType): Promise<number> {
    try {
      // Garantir que a data está no formato correto
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Set end of day for the same date
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Formatação de datas para ISO 8601
      const targetIso = targetDate.toISOString();
      const endIso = endDate.toISOString();
      
      // Usar contagem direta via SQL para melhor desempenho
      const result = await db.select({ count: sql`count(*)` })
        .from(assignments)
        .where(
          and(
            sql`${assignments.date} >= ${targetIso}`,
            sql`${assignments.date} <= ${endIso}`,
            eq(assignments.operationType, operationType)
          )
        );
      
      if (result && result[0] && result[0].count) {
        return parseInt(result[0].count as string);
      }
      
      return 0;
    } catch (error) {
      console.error("[Storage] Erro ao contar assignments para data específica:", error);
      // Retornar 0 em caso de erro para não quebrar a aplicação
      return 0;
    }
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();