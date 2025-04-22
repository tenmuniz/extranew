/**
 * Script de inicialização para o Railway (versão CommonJS)
 * Este arquivo é usado pelo Procfile para iniciar a aplicação no Railway
 */

console.log('Iniciando aplicação no Railway (CommonJS)...');

// Configurar variáveis de ambiente
process.env.PORT = process.env.PORT || '8080';
console.log(`Porta configurada: ${process.env.PORT}`);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log(`Ambiente: ${process.env.NODE_ENV}`);

// Verificar conexão com banco de dados
if (!process.env.DATABASE_URL) {
  console.warn('AVISO: DATABASE_URL não está definida. A aplicação usará armazenamento em memória.');
} else {
  console.log('DATABASE_URL configurada.');
}

// Iniciar o servidor
try {
  console.log('Executando servidor compilado...');
  // No CommonJS, não podemos usar import(), então executamos diretamente o arquivo
  const { spawn } = require('child_process');
  const server = spawn('node', ['dist/server/index.js'], {
    stdio: 'inherit',
    env: process.env
  });

  server.on('error', (err) => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  });

  // Repassar sinais do sistema para o processo filho
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`Recebido sinal ${signal}, encerrando servidor...`);
      server.kill(signal);
    });
  });

  // Se o servidor filho terminar, encerrar o processo principal também
  server.on('exit', (code) => {
    console.log(`Servidor encerrado com código ${code}`);
    process.exit(code);
  });

} catch (err) {
  console.error('Erro durante inicialização:', err);
  process.exit(1);
}