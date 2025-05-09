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
import { WebSocketServer, WebSocket } from 'ws';

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

      // Verificar primeiro se existem atribuições para este militar
      const allAssignments = await storage.getAllAssignments();
      const hasAssignments = allAssignments.some(a => a.personnelId === id);
      
      if (hasAssignments) {
        // Não permitir excluir militar com atribuições
        return res.status(400).json({ 
          message: "Não é possível excluir um militar com escalas atribuídas. Remova todas as escalas antes de excluir o militar." 
        });
      }

      const success = await storage.deletePersonnel(id);
      
      if (!success) {
        return res.status(404).json({ message: "Personnel not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir militar:", error);
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
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const personnelId = assignmentToDelete.personnelId;
      
      // Excluir a atribuição
      const success = await storage.deleteAssignment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
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
  
  // Configurar WebSocket server para atualizações em tempo real
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Armazenar clientes conectados
  const clients: WebSocket[] = [];
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client conectado');
    
    // Adicionar cliente à lista de clientes conectados
    clients.push(ws);
    
    // Enviar dados iniciais para o cliente quando se conectar
    const sendInitialData = async () => {
      try {
        const personnel = await storage.getAllPersonnel();
        const assignments = await storage.getAllAssignments();
        
        const initialData = {
          type: 'INITIAL_DATA',
          payload: {
            personnel,
            assignments
          }
        };
        
        // Verificar se o socket está aberto (OPEN = 1)
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(initialData));
        }
      } catch (error) {
        console.error('Erro enviando dados iniciais via WebSocket:', error);
      }
    };
    
    sendInitialData();
    
    // Lidar com mensagens do cliente
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensagem recebida do cliente:', data.type);
        
        // Processar mensagens específicas se necessário
        if (data.type === 'REQUEST_REFRESH') {
          sendInitialData();
        } else if (data.type === 'PING') {
          // Responder ao ping para manter a conexão viva
          if (ws.readyState === 1) { // OPEN = 1
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
        }
      } catch (error) {
        console.error('Erro processando mensagem do cliente:', error);
      }
    });
    
    // Remover cliente quando desconectar
    ws.on('close', () => {
      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      console.log('WebSocket client desconectado');
    });
  });
  
  // Função para enviar atualização para todos os clientes
  const broadcastUpdate = (type: string, payload: any) => {
    const message = JSON.stringify({ type, payload });
    
    clients.forEach(client => {
      // Verificar se o socket está aberto (OPEN = 1)
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  };
  
  // Sobrescrever métodos de storage para adicionar sincronização
  const originalCreatePersonnel = storage.createPersonnel.bind(storage);
  storage.createPersonnel = async function(data: any): Promise<any> {
    const result = await originalCreatePersonnel(data);
    const personnel = await storage.getAllPersonnel();
    broadcastUpdate('PERSONNEL_UPDATED', { personnel });
    return result;
  };
  
  // Vamos definir a função corretamente para preservar 'this'
  const originalUpdatePersonnel = storage.updatePersonnel.bind(storage);
  storage.updatePersonnel = async function(id: number, data: any): Promise<any> {
    try {
      // Chamar o método original, mantendo 'this' como storage
      const result = await originalUpdatePersonnel(id, data);
      if (result) {
        const personnel = await storage.getAllPersonnel();
        broadcastUpdate('PERSONNEL_UPDATED', { personnel });
      }
      return result;
    } catch (error) {
      console.error('[WebSocket] Erro ao atualizar militar:', error);
      throw error;
    }
  };
  
  const originalDeletePersonnel = storage.deletePersonnel.bind(storage);
  storage.deletePersonnel = async function(id: number): Promise<boolean> {
    try {
      const result = await originalDeletePersonnel(id);
      if (result) {
        const personnel = await storage.getAllPersonnel();
        broadcastUpdate('PERSONNEL_UPDATED', { personnel });
      }
      return result;
    } catch (error) {
      console.error('[WebSocket] Erro ao excluir militar:', error);
      throw error;
    }
  };
  
  const originalCreateAssignment = storage.createAssignment.bind(storage);
  storage.createAssignment = async function(data: any): Promise<any> {
    try {
      const result = await originalCreateAssignment(data);
      const assignments = await storage.getAllAssignments();
      const personnel = await storage.getAllPersonnel();
      broadcastUpdate('DATA_UPDATED', { assignments, personnel });
      return result;
    } catch (error) {
      console.error('[WebSocket] Erro ao criar atribuição:', error);
      throw error;
    }
  };
  
  const originalDeleteAssignment = storage.deleteAssignment.bind(storage);
  storage.deleteAssignment = async function(id: number): Promise<boolean> {
    try {
      const result = await originalDeleteAssignment(id);
      if (result) {
        const assignments = await storage.getAllAssignments();
        const personnel = await storage.getAllPersonnel();
        broadcastUpdate('DATA_UPDATED', { assignments, personnel });
      }
      return result;
    } catch (error) {
      console.error('[WebSocket] Erro ao excluir atribuição:', error);
      throw error;
    }
  };
  
  return httpServer;
}
