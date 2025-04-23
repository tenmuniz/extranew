import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPersonnelSchema, 
  insertAssignmentSchema, 
  dateRangeSchema,
  operationTypeEnum
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling utility
  const handleError = (res: Response, error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  };

  // Personnel routes
  app.get("/api/personnel", async (_req, res) => {
    try {
      const personnel = await storage.getAllPersonnel();
      res.json(personnel);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/personnel", async (req, res) => {
    try {
      const data = insertPersonnelSchema.parse(req.body);
      const newPersonnel = await storage.createPersonnel(data);
      res.status(201).json(newPersonnel);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const data = insertPersonnelSchema.partial().parse(req.body);
      const updatedPersonnel = await storage.updatePersonnel(id, data);
      
      if (!updatedPersonnel) {
        return res.status(404).json({ message: "Personnel not found" });
      }
      
      res.json(updatedPersonnel);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/personnel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deletePersonnel(id);
      
      if (!success) {
        return res.status(404).json({ message: "Personnel not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (req, res) => {
    try {
      // Obter todos os assignments sem filtragem por data
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const data = insertAssignmentSchema.parse(req.body);
      
      // Check if the personnel exists
      const personnelRecord = await storage.getPersonnel(data.personnelId);
      if (!personnelRecord) {
        return res.status(404).json({ message: "Personnel not found" });
      }

      // Convert date string to Date object
      const assignmentDate = new Date(data.date);
      
      // For Escola Segura, verify it's a weekday (not Saturday or Sunday)
      if (data.operationType === "ESCOLA") {
        const dayOfWeek = assignmentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return res.status(400).json({ 
            message: "Escola Segura operation can only be scheduled on weekdays" 
          });
        }
      }
      
      // Check if the day's quota is already filled
      const currentCount = await storage.getAssignmentsCountForDay(
        assignmentDate, 
        data.operationType
      );
      
      const maxAllowed = data.operationType === "PMF" ? 3 : 2;
      if (currentCount >= maxAllowed) {
        return res.status(400).json({ 
          message: `Maximum of ${maxAllowed} personnel allowed per day for this operation` 
        });
      }
      
      const newAssignment = await storage.createAssignment(data);
      
      // Atualizar o contador de extras do militar
      const personnelToUpdate = await storage.getPersonnel(data.personnelId);
      if (personnelToUpdate) {
        // Calcular o total de extras para este militar em ambas as operações
        const allAssignments = await storage.getAllAssignments();
        const personnelAssignments = allAssignments.filter((a) => a.personnelId === data.personnelId);
        const totalExtras = personnelAssignments.length;
        
        // Atualizar o contador de extras
        await storage.updatePersonnel(data.personnelId, { extras: totalExtras });
      }
      
      res.status(201).json(newAssignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Obter a atribuição antes de excluí-la para saber qual militar atualizar
      const allAssignments = await storage.getAllAssignments();
      const assignmentToDelete = allAssignments.find((a) => a.id === id);
      
      if (!assignmentToDelete) {
        console.log(`[API] Atribuição com ID ${id} não encontrada para exclusão`);
        // Se já foi excluída, consideramos a operação bem-sucedida
        return res.status(204).end();
      }
      
      const personnelId = assignmentToDelete.personnelId;
      
      // Excluir a atribuição
      const success = await storage.deleteAssignment(id);
      
      if (!success) {
        console.log(`[API] Falha ao excluir atribuição com ID ${id}`);
        // Se já foi excluída, consideramos a operação bem-sucedida
        return res.status(204).end();
      }
      
      // Atualizar o contador de extras do militar após a exclusão
      const personnelToUpdate = await storage.getPersonnel(personnelId);
      if (personnelToUpdate) {
        // Calcular o novo total de extras para este militar
        const updatedAssignments = await storage.getAllAssignments();
        const personnelAssignments = updatedAssignments.filter((a) => a.personnelId === personnelId);
        const totalExtras = personnelAssignments.length;
        
        // Atualizar o contador de extras
        await storage.updatePersonnel(personnelId, { extras: totalExtras });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Check assignment availability for a specific day and operation
  app.get("/api/assignments/availability", async (req, res) => {
    try {
      const { date, operationType } = req.query as { date?: string, operationType?: string };
      
      if (!date || !operationType) {
        return res.status(400).json({ message: "Date and operation type are required" });
      }
      
      // Validate operation type
      const validatedOperationType = operationTypeEnum.parse(operationType);
      
      // Get current count
      const assignmentDate = new Date(date);
      const currentCount = await storage.getAssignmentsCountForDay(
        assignmentDate, 
        validatedOperationType
      );
      
      // Check if the date is valid for Escola Segura (weekday)
      const dayOfWeek = assignmentDate.getDay();
      const isValidDay = validatedOperationType !== "ESCOLA" || (dayOfWeek > 0 && dayOfWeek < 6);
      
      const maxAllowed = validatedOperationType === "PMF" ? 3 : 2;
      const available = isValidDay && currentCount < maxAllowed;
      
      res.json({
        available,
        currentCount,
        maxAllowed,
        isValidDay
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
