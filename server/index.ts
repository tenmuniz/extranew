import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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
    
    // Carregar variáveis de ambiente do arquivo .env.production em ambiente de produção
    if (process.env.NODE_ENV === 'production') {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const envPath = path.resolve(__dirname, '..', '.env.production');
      
      if (fs.existsSync(envPath)) {
        console.log(`[Sistema] Carregando variáveis de ambiente de ${envPath}`);
        try {
          const envConfig = dotenv.parse(fs.readFileSync(envPath));
          for (const key in envConfig) {
            process.env[key] = envConfig[key];
          }
          console.log('[Sistema] Variáveis de ambiente carregadas com sucesso');
        } catch (error) {
          console.error('[Sistema] Erro ao carregar variáveis de ambiente:', error);
        }
      } else {
        console.log('[Sistema] Arquivo .env.production não encontrado, usando variáveis existentes');
      }
    }
    
    // Usando armazenamento em memória, não é necessário inicializar banco de dados
    console.log("[Sistema] Usando armazenamento em memória");
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
