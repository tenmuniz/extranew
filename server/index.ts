import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { initializeDatabase } from "./db-init";

// Executar push do schema para o banco de dados na inicialização
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as schema from "@shared/schema";

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
    // Executar push do schema e inicializar banco de dados
    await initializeDatabase();
    console.log("[DB] Banco de dados inicializado com sucesso");
  } catch (error) {
    console.error("[DB] Erro ao inicializar o banco de dados:", error);
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
