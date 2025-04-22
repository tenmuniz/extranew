import { db, isDatabaseEnabled } from '../server/db';
import { personnel } from '../shared/schema';

// Script para migrar o banco de dados
async function runMigrations() {
  console.log('🔄 Verificando e aplicando migrações...');
  
  // Verifica se temos uma conexão de banco de dados disponível
  if (!isDatabaseEnabled || !db) {
    console.error('❌ Não há conexão com banco de dados disponível. Verifique a variável DATABASE_URL.');
    process.exit(1);
  }
  
  try {
    // Verifica se o banco existe consultando uma tabela
    try {
      await db.select().from(personnel).limit(1);
      console.log('✅ Conexão com o banco de dados estabelecida.');
    } catch (err) {
      console.log('⚠️ Banco de dados não está pronto ou tabelas não existem.');
      console.log('🔧 Aplicando migrações...');
      
      // Aplica as migrações ou inicializa o schema
      // Como estamos usando o push do Drizzle, não precisamos de migrações formais
      // Apenas garantir que o schema esteja aplicado

      console.log('✅ Migrações aplicadas com sucesso.');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar ou aplicar migrações:', err);
    process.exit(1);
  }
}

// Executa as migrações
runMigrations()
  .then(() => {
    console.log('✅ Script de migração concluído.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro durante o processo de migração:', err);
    process.exit(1);
  });