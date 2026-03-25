# Setup - Autenticação e Sincronização com Turso

Este guia explica como configurar a autenticação e sincronização com Turso no Focus App.

## 📋 Pré-requisitos

1. Uma conta no [Turso](https://turso.tech)
2. Node.js 18+ instalado
3. npm ou yarn

## 🚀 Passo a Passo

### 1. Criar Banco de Dados no Turso

1. Acesse [turso.tech](https://turso.tech) e crie uma conta
2. Crie um novo banco de dados
3. Copie a URL do banco (formato: `libsql://seu-banco.turso.io`)
4. Gere um token de autenticação
5. Copie o token gerado

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:
```env
# Turso Database
TURSO_DATABASE_URL=libsql://seu-banco.turso.io
TURSO_AUTH_TOKEN=seu-token-aqui

# JWT
JWT_SECRET=uma-chave-secreta-muito-segura-aqui
JWT_EXPIRES_IN=7d

# Migration (opcional)
MIGRATION_SECRET=uma-chave-para-migrations

# App
VITE_API_URL=/api
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar Migração do Banco

Após fazer deploy (ou em desenvolvimento local com Vercel CLI), execute a migração:

```bash
# Com Vercel CLI
curl -X POST https://seu-app.vercel.app/api/db/migrate \
  -H "x-migration-secret: sua-chave-de-migration"
```

Ou acesse diretamente no navegador (se não tiver MIGRATION_SECRET configurado):
```
https://seu-app.vercel.app/api/db/migrate
```

### 5. Executar em Desenvolvimento

```bash
npm run dev
```

## 📁 Estrutura de Arquivos Criados

```
api/
├── auth/
│   ├── login.ts          # POST /api/auth/login
│   ├── register.ts       # POST /api/auth/register
│   ├── logout.ts         # POST /api/auth/logout
│   └── me.ts             # GET /api/auth/me
├── db/
│   ├── turso.ts          # Conexão com Turso
│   └── migrate.ts        # POST /api/db/migrate
├── middleware/
│   └── auth.ts           # Middleware de autenticação JWT
├── migrations/
│   └── 001_initial.sql   # Schema do banco
├── subjects.ts           # GET/POST /api/subjects
├── topics.ts             # GET/POST /api/topics
├── settings.ts           # GET/PUT /api/settings
└── sync.ts               # GET/POST /api/sync

src/
├── components/
│   └── ProtectedRoute.tsx # Componente de rota protegida
├── pages/
│   ├── LoginPage.tsx      # Página de login
│   └── RegisterPage.tsx   # Página de cadastro
└── services/
    ├── authService.ts     # Serviço de autenticação
    ├── apiService.ts      # Serviço de API
    └── syncService.ts     # Serviço de sincronização
```

## 🔐 Fluxo de Autenticação

1. **Cadastro**: Usuário cria conta com email, senha e nome
2. **Login**: Usuário faz login e recebe JWT token
3. **Sessão**: Token é armazenado em localStorage
4. **Rotas Protegidas**: `ProtectedRoute` verifica token antes de renderizar
5. **Logout**: Token é removido do localStorage

## 🔄 Fluxo de Sincronização

1. **Login**: Dados são baixados do servidor (pull)
2. **Operações CRUD**: Dados são salvos localmente (IndexedDB) e enviados ao servidor (push)
3. **Offline**: Operações funcionam offline via IndexedDB
4. **Reconexão**: Ao voltar online, dados são sincronizados automaticamente

## 🧪 Testando

### Criar um usuário:
```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","senha":"123456","nome":"Teste"}'
```

### Fazer login:
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","senha":"123456"}'
```

### Verificar usuário (com token):
```bash
curl http://localhost:5173/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## ⚠️ Notas Importantes

1. **Segurança**: Nunca commite o arquivo `.env` no git
2. **JWT_SECRET**: Use uma chave forte e única em produção
3. **HTTPS**: Em produção, sempre use HTTPS
4. **Backup**: Faça backup regular do banco Turso

## 🔧 Troubleshooting

### Erro "Cannot find module '@libsql/client'"
```bash
npm install
```

### Erro "TURSO_DATABASE_URL not set"
Verifique se o arquivo `.env` está configurado corretamente.

### Migração não funciona
Verifique se o `MIGRATION_SECRET` está correto ou remova a verificação em desenvolvimento.

## 📚 Próximos Passos

- [ ] Implementar refresh token
- [ ] Adicionar recuperação de senha
- [ ] Implementar OAuth (Google, GitHub)
- [ ] Adicionar 2FA
- [ ] Implementar sync em tempo real
