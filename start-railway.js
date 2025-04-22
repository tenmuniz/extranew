// Script de inicialização para o Railway
// Este arquivo é um script simples para iniciar a aplicação no Railway

console.log('Iniciando a aplicação no Railway...');

// Variáveis de ambiente necessárias
if (!process.env.PORT) {
  console.log('Definindo PORT padrão: 8080');
  process.env.PORT = '8080';
}

if (!process.env.NODE_ENV) {
  console.log('Definindo NODE_ENV: production');
  process.env.NODE_ENV = 'production';
}

// Verificar conexão com banco de dados
if (!process.env.DATABASE_URL) {
  console.warn('AVISO: DATABASE_URL não está definida. A aplicação usará armazenamento em memória.');
} else {
  console.log('DATABASE_URL configurada.');
}

// Importar o arquivo principal
try {
  console.log('Importando servidor...');
  import('./dist/server/index.js')
    .then(() => {
      console.log('Servidor importado com sucesso.');
    })
    .catch(err => {
      console.error('Erro ao importar servidor:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Erro durante inicialização:', err);
  process.exit(1);
}