# Lista de Verificação para Migração

## 🔧 Remover dependências do Replit

- [x] O projeto não usa mais banco de dados do Replit (migrado para PostgreSQL)
- [x] Nenhuma URL no código aponta para domínios `.replit.app` ou `.repl.co`
- [x] O `.env` não possui nenhuma variável ligada ao Replit
- [x] Criado arquivo `vite.config.railway.ts` sem dependências do Replit
- [x] O projeto foi configurado para funcionar com a string de conexão do Railway

## 🛠️ Preparar estrutura para banco de dados no Railway

- [x] Configurado no `.env` a variável `DATABASE_URL` com valor para Railway
- [x] O banco de dados já está pronto para se conectar ao PostgreSQL
- [x] Todas as chamadas ao banco estão centralizadas em DatabaseStorage
- [x] O Procfile está configurado corretamente para iniciar a aplicação

## 📦 Compatibilidade de Módulos e Inicialização

- [x] Criado arquivo `start-railway.cjs` para compatibilidade CommonJS
- [x] Criado arquivo `setup-environment.cjs` para correção de erros ES Module/CommonJS
- [x] Script `railway-setup.sh` para inicializar corretamente o banco de dados
- [x] Implementada verificação alternativa de criação de tabelas caso drizzle falhe
- [x] Adicionado gerenciamento de sinal SIGTERM para shutdown gracioso

## 📝 Documentação

- [x] Criado MIGRATION_GUIDE.md com instruções detalhadas
- [x] Criado MIGRATION_CHECKLIST.md para garantir que todos os passos foram seguidos
- [x] Criado arquivo .env.example para referência
- [x] Documentado processo de troubleshooting para erros comuns

## 🔐 Segurança

- [x] Arquivos de configuração sensíveis (.env) adicionados ao .gitignore
- [x] Strings de conexão com o banco não estão expostas no código
- [x] Todas as credenciais são armazenadas em variáveis de ambiente
- [x] Configuração para usar automaticamente variáveis de ambiente fornecidas pelo Railway

## ✅ Pós-Migração

- [ ] Testar acesso ao banco de dados PostgreSQL do Railway
- [ ] Verificar se os dados iniciais foram carregados corretamente
- [ ] Confirmar que o calendário e as operações estão funcionando
- [ ] Validar a gestão de pessoal (adicionar, editar, remover)
- [ ] Testar geração de relatórios e detecção de conflitos

## 🚀 Performance e Estabilidade

- [x] Implementado gerenciamento de portas através de variáveis de ambiente
- [x] Handlers de erro aprimorados para prevenir crashes em produção
- [x] Configurado sistema de restart automático em caso de falha
- [x] Adicionado logging detalhado para troubleshooting em produção