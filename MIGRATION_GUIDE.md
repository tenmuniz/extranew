# Guia de Migração: Replit → Railway

Este guia apresenta os passos necessários para migrar a aplicação de agendamento da 20ª CIPM do Replit para o Railway.

## Pré-requisitos

1. Conta no GitHub
2. Conta no Railway
3. Git instalado localmente (opcional, mas recomendado)

## Etapas de Migração

### 1. Exportar o código do Replit

1. No Replit, clique em "Tools" → "Git"
2. Se o repositório não estiver inicializado, inicialize-o
3. Faça commit de todas as alterações pendentes
4. Conecte ao GitHub e faça push para um novo repositório

### 2. Ajustar arquivos de configuração

Após clonar o repositório em seu ambiente local, faça as seguintes alterações:

#### Substituir vite.config.ts

Renomeie o arquivo `vite.config.railway.ts` para `vite.config.ts` para remover as dependências do Replit.

#### Preparar o .env

O arquivo `.env` já está criado com a variável `DATABASE_URL`. Certifique-se de que esse arquivo esteja listado no `.gitignore` para não expor credenciais.

### 3. Configurar o Railway

1. Acesse [Railway](https://railway.app/)
2. Crie um novo projeto a partir do GitHub
3. Selecione o repositório que contém o código exportado do Replit
4. Adicione o serviço PostgreSQL ao projeto:
   - Clique em "New" → "Database" → "PostgreSQL"
   - Aguarde a criação do banco de dados

5. Configure as variáveis de ambiente:
   - Vá para o serviço da aplicação
   - Clique em "Variables"
   - Conecte a variável `DATABASE_URL` com a string de conexão do PostgreSQL criado:
     ```
     DATABASE_URL=postgresql://[usuario]:[senha]@[host]:[porta]/[nome-banco]
     ```

### 4. Deploy e Configuração

1. Railway detectará automaticamente o Procfile e executará o script de build e inicialização
2. **IMPORTANTE**: Após o primeiro deploy ser concluído, é necessário aplicar as migrações manualmente:
   - Acesse o shell do serviço no Railway
   - Execute o script `./setup-railway.sh` (ou `npm run db:push` para criar as tabelas)
   - Este passo só precisa ser executado uma vez após o deploy inicial
3. Após o deploy e migração, a aplicação estará disponível no domínio fornecido pelo Railway

### 5. Verificação

Após o deploy, verificar se:

1. O banco de dados foi criado corretamente (tabelas `personnel` e `assignments`)
2. Os dados iniciais foram carregados
3. A aplicação está acessível e funcionando como esperado

## Solução de Problemas

### Falha no Deploy

Se o deploy falhar, verifique:

1. **Problema de banco de dados**: Verifique se a variável `DATABASE_URL` está configurada corretamente
2. **Problema de build**: Verifique os logs de construção no Railway
3. **Migrações**: Se necessário, execute manualmente o comando de migração:
   ```
   npm run db:push
   ```

### Dados Não Carregados

Se os dados iniciais não forem carregados:

1. Acesse o console do Railway
2. Execute manualmente:
   ```
   npm run db:push
   ```
3. Reinicie a aplicação

## Referências

- [Documentação do Railway](https://docs.railway.app/)
- [Documentação do Drizzle ORM](https://orm.drizzle.team/docs/overview)