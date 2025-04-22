import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupRailwayEnvironment, setupGracefulShutdown } from "./railway";

// Configure o ambiente do Railway se estiver em produção
if (process.env.NODE_ENV === 'production') {
  setupRailwayEnvironment();
}

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

  // Configurar graceful shutdown para o Railway
  if (process.env.NODE_ENV === 'production') {
    setupGracefulShutdown(server);
  }

  // Determinar a porta a ser usada
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  
  // Iniciar o servidor na porta apropriada
  server.listen({
    port: PORT,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Servidor iniciado na porta ${PORT}`);
    log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    log(`URL do banco de dados configurada: ${process.env.DATABASE_URL ? 'Sim' : 'Não'}`);
  }).on('error', (err: any) => {
    log(`Erro ao iniciar o servidor: ${err.message}`);
    
    if (err.code === 'EADDRINUSE') {
      log(`A porta ${PORT} já está em uso. Configure uma porta diferente na variável PORT.`);
    }
    
    // Em produção, falhar rapidamente
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
})();
