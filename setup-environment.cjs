/**
 * Script de inicialização para o ambiente Railway
 * 
 * Este script é executado antes de iniciar o servidor para garantir
 * que todas as configurações e variáveis de ambiente estejam corretas.
 */

console.log('Iniciando configuração de ambiente para Railway...');

// Verifica variáveis de ambiente críticas
if (!process.env.DATABASE_URL) {
  console.warn('AVISO: DATABASE_URL não está definida. A aplicação usará armazenamento em memória.');
} else {
  console.log('DATABASE_URL configurada corretamente.');
}

// Configurar porta para o Railway
process.env.PORT = process.env.PORT || "8080";
console.log(`Porta configurada: ${process.env.PORT}`);

// Configurar NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
console.log(`Ambiente: ${process.env.NODE_ENV}`);

// Imprimir informações do sistema
console.log(`Node.js versão: ${process.version}`);
console.log(`Plataforma: ${process.platform}`);
console.log(`Memória disponível: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`);
console.log('Configuração de ambiente concluída.');

// No CommonJS, precisamos exportar algo
exports.setupEnvironment = true;