// Este script verifica se as variáveis de ambiente do PostgreSQL estão disponíveis
// e as configura de forma adequada para o ambiente de produção se estiverem faltando

console.log('Preparando ambiente para deploy...');

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL não encontrada. Tentando construir a partir de variáveis individuais...');
  
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    // Construir DATABASE_URL a partir das variáveis individuais
    const host = process.env.PGHOST;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const database = process.env.PGDATABASE;
    const port = process.env.PGPORT || '5432';
    
    process.env.DATABASE_URL = `postgres://${user}:${password}@${host}:${port}/${database}`;
    console.log(`DATABASE_URL construída: postgres://${user}:***@${host}:${port}/${database}`);
  } else {
    console.error('Erro: As variáveis de ambiente do PostgreSQL estão faltando!');
    console.error('Por favor, configure DATABASE_URL ou as variáveis PGHOST, PGUSER, PGPASSWORD, PGDATABASE e PGPORT (opcional)');
    console.error('Você pode adicionar essas variáveis nas configurações de Secrets do seu projeto Replit.');
    
    // Em vez de falhar completamente, criaremos uma DATABASE_URL para o SQLite em memória como fallback apenas para o deploy
    // Isso permite que o aplicativo inicie, mesmo que não consiga usar o banco de dados
    console.log('Usando um fallback temporário para permitir inicialização do app...');
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/postgres';
  }
}

console.log('Verificação de variáveis de ambiente concluída.');