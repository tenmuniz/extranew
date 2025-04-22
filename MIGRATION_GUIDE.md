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

### 2. Preparar arquivos de configuração

Após clonar o repositório, antes de fazer o deploy no Railway:

#### Preparar package.json para o Railway

Para garantir compatibilidade com o Railway, utilize o arquivo `package.railway.json` incluído no projeto:

```bash
# No terminal do Railway ou localmente antes do push
cp package.railway.json package.json
```

Este arquivo contém configurações específicas para o ambiente de produção, incluindo a configuração `"engines"` que define a versão do Node.js compatível.

#### Configurar variáveis de ambiente

O arquivo `.env.example` contém um modelo das variáveis de ambiente necessárias. No Railway, você precisará configurar:

- `DATABASE_URL`: String de conexão com o PostgreSQL (definida automaticamente ao adicionar um banco de dados no Railway)
- `NODE_ENV`: Defina como "production"

### 3. Configurar o Railway

1. Acesse [Railway](https://railway.app/)
2. Crie um novo projeto a partir do GitHub
3. Selecione o repositório que contém o código exportado do Replit
4. Adicione o serviço PostgreSQL ao projeto:
   - Clique em "New" → "Database" → "PostgreSQL"
   - Aguarde a criação do banco de dados

5. Configure o redirecionamento das variáveis de ambiente:
   - Vá para o serviço da aplicação
   - Clique em "Variables"
   - Railway criará automaticamente a variável `DATABASE_URL`, certifique-se de que esteja corretamente vinculada ao banco de dados.

### 4. Deploy e Inicialização

1. O Railway detectará automaticamente o `Procfile` e executará o script definido nele.
2. O processo de build será executado automaticamente através do script `postinstall` no package.json.
3. **IMPORTANTE**: Para inicializar o banco de dados após o primeiro deploy:
   - Acesse o shell do serviço no Railway clicando em "Shell"
   - Execute o script de configuração:
     ```bash
     ./railway-setup.sh
     ```
   - Alternativamente, você pode executar diretamente:
     ```bash
     npm run db:push
     ```

4. Após a configuração inicial, a aplicação estará disponível no domínio fornecido pelo Railway.

### 5. Otimizações Implementadas

Para garantir o funcionamento estável no Railway, implementamos:

1. **Graceful Shutdown**: Gerenciamento adequado de encerramento da aplicação quando o Railway envia sinais SIGTERM.
2. **Gestão de Portas**: A aplicação usa automaticamente a porta definida pela variável `PORT` do Railway.
3. **Gestão de Erros**: Melhor tratamento de erros para evitar crashes inesperados.
4. **Otimização de Build**: Configuração de build específica para ambiente de produção.

### 6. Verificação

Após o deploy, verifique:

1. Se o banco de dados foi inicializado corretamente (tabelas `personnel` e `assignments`)
2. Se os dados iniciais foram carregados
3. Se a aplicação está acessível através da URL fornecida pelo Railway
4. Se o calendário e a lista de pessoal estão carregando corretamente

## Solução de Problemas

### Aplicação não inicia ou crasha

Se a aplicação não iniciar ou crashar frequentemente:

1. Verifique os logs do Railway para identificar o problema específico
2. Execute o script `railway-setup.sh` que faz verificações adicionais
3. Certifique-se de que todas as variáveis de ambiente estão configuradas corretamente
4. Verifique se o banco de dados PostgreSQL está acessível

### Erro de banco de dados

Se encontrar erros relacionados ao banco de dados:

1. Verifique se a variável `DATABASE_URL` está corretamente configurada
2. Conecte-se ao banco através do shell do Railway e execute:
   ```bash
   npm run db:push
   ```
3. Verifique se as tabelas foram criadas corretamente:
   ```sql
   \dt
   ```

### Erros de build

Se o processo de build falhar:

1. Verifique os logs de build no Railway
2. Tente usar o `package.railway.json` como `package.json`
3. Certifique-se de que o Node.js 18 ou superior está sendo usado

## Referências

- [Documentação do Railway](https://docs.railway.app/)
- [Guia de Deployment do Railway](https://docs.railway.app/guides/nodejs)
- [Documentação do Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Otimizações do Node.js em Produção](https://expressjs.com/en/advanced/best-practice-performance.html)