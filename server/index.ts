import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, pool } from "./db";
import { initializeDatabase, validateDatabaseIntegrity } from "./db-init";

// Importações para migrações e schema
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("[Sistema] Iniciando a aplicação...");
    console.log(`[Sistema] Ambiente: ${process.env.NODE_ENV || 'não definido'}`);
    
    // Número máximo de tentativas de conexão com o banco
    const maxRetries = process.env.NODE_ENV === 'production' ? 5 : 2;
    let retryCount = 0;
    let dbInitialized = false;
    
    // Função para tentativa de inicialização do banco com retry
    const tryInitDatabase = async () => {
      try {
        // Verificar a conexão com o banco primeiro
        const client = await pool.connect();
        console.log("[DB] Conexão com o banco estabelecida");
        client.release();
        
        // Executar push do schema e inicializar banco de dados
        await initializeDatabase();
        console.log("[DB] Banco de dados inicializado com sucesso");

        // Verificar e corrigir a integridade dos dados
        await validateDatabaseIntegrity();
        
        // Indicar sucesso
        dbInitialized = true;
      } catch (dbError) {
        retryCount++;
        console.error(`[DB] Tentativa ${retryCount}/${maxRetries} - Erro na inicialização do banco:`, dbError);
        
        if (retryCount < maxRetries) {
          // Tempo de espera progressivo entre tentativas (1s, 2s, 4s, ...)
          const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          console.log(`[DB] Tentando reconectar em ${waitTime/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return tryInitDatabase(); // Tentativa recursiva
        } else {
          console.error("[DB] Todas as tentativas de conexão falharam");
          // Em produção, podemos continuar mesmo com falha, já que o app pode reiniciar automaticamente
          if (process.env.NODE_ENV === 'production') {
            console.log("[DB] Continuando execução da aplicação, mas banco de dados pode não estar acessível");
          }
        }
      }
    };
    
    // Iniciar processo de inicialização
    await tryInitDatabase();
    
    if (!dbInitialized && process.env.NODE_ENV !== 'production') {
      console.error("[Sistema] Não foi possível inicializar o banco de dados após múltiplas tentativas.");
    }
  } catch (startupError) {
    console.error("[Sistema] Erro crítico na inicialização:", startupError);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Attempt to serve the app on port 5000, but fallback to other ports if needed
  const tryListen = (initialPort: number, maxAttempts: number = 3) => {
    let attempts = 0;
    
    const attemptListen = (currentPort: number) => {
      attempts++;
      server.listen({
        port: currentPort,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`serving on port ${currentPort}`);
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && attempts < maxAttempts) {
          const nextPort = currentPort + 1;
          log(`Port ${currentPort} is in use, trying port ${nextPort}...`);
          // Try the next port
          attemptListen(nextPort);
        } else {
          log(`Failed to start server: ${err.message}`);
          throw err;
        }
      });
    };
    
    attemptListen(initialPort);
  };
  
  tryListen(5000);
})();
