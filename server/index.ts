import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { closePool } from "./db";

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
  // Verificar se temos a variável DATABASE_URL no ambiente
  const hasDbUrl = !!process.env.DATABASE_URL;
  
  try {
    // Inicializar o banco de dados antes de tudo
    if (hasDbUrl) {
      try {
        await initializeDatabase();
        console.log("Banco de dados inicializado com sucesso!");
      } catch (error) {
        console.error("Erro ao inicializar banco de dados:", error);
        
        // Se estamos em produção, falhar rápido
        if (process.env.NODE_ENV === 'production') {
          console.error("Falha crítica na inicialização do banco de dados em produção. Encerrando aplicativo.");
          process.exit(1);
        } else {
          console.warn("Falha na inicialização do banco de dados em ambiente de desenvolvimento. Continuando sem banco de dados.");
        }
      }
    } else {
      console.warn("DATABASE_URL não está definida. Pulando inicialização do banco de dados.");
      console.warn("Para habilitar funcionalidades de banco de dados, defina a variável DATABASE_URL.");
      
      // Se estamos em produção, alertar que isso é um problema
      if (process.env.NODE_ENV === 'production') {
        console.error("Atenção: Aplicativo em produção está rodando sem DATABASE_URL configurada!");
      }
    }
  } catch (error) {
    console.error("Erro inesperado durante inicialização:", error);
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

  // Attempt to serve the app on the PORT environment variable or default to 5000
  const PORT = process.env.PORT || 5000;
  
  const startServer = () => {
    server.listen({
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Servidor rodando na porta ${PORT}`);
      log(`Modo: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.DATABASE_URL) {
        log('Banco de dados PostgreSQL conectado');
      }
    }).on('error', (err: any) => {
      log(`Falha ao iniciar o servidor: ${err.message}`);
      throw err;
    });
  };
  
  startServer();
  
  // Gerenciamento gracioso de encerramento
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} recebido. Encerrando graciosamente...`);
    
    // Fechar o pool de conexões do banco de dados
    try {
      await closePool();
    } catch (error) {
      console.error('Erro ao fechar conexões do banco de dados:', error);
    }
    
    // Fechar o servidor
    server.close(() => {
      console.log('Servidor HTTP encerrado.');
      process.exit(0);
    });
    
    // Forçar encerramento após 10 segundos
    setTimeout(() => {
      console.error('Encerramento forçado após timeout de 10s');
      process.exit(1);
    }, 10000);
  };
  
  // Registrar eventos para encerramento gracioso
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
