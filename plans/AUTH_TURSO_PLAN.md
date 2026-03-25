# Plano de Evolução: Autenticação e Sincronização com Turso

## 📋 Resumo

Este documento descreve o plano para evoluir o Focus App de um aplicativo com storage local (IndexedDB + localStorage) para um aplicativo com autenticação de usuários e sincronização remota com banco de dados SQLite no Turso.

---

## 🔍 Análise do Sistema Atual

### Storage Atual

#### IndexedDB (via biblioteca `idb`)
- **Nome do banco:** `focus-db-{profileId}` (um banco por perfil)
- **Versão:** 4
- **Object Stores:**
  - `subjects` (keyPath: `id`)
  - `topics` (keyPath: `id`, index: `subjectId`)
  - `subtopics` (keyPath: `id`, index: `topicId`)
  - `notes` (keyPath: `id`, index: `topicId`)
  - `questions` (keyPath: `id`, index: `topicId`)
  - `studySessions` (keyPath: `id`, index: `topicId`)
  - `reviewSchedules` (keyPath: `id`, indexes: `topicId`, `status`)
  - `reviewAttempts` (keyPath: `id`, index: `scheduleId`)
  - `questionHistory` (keyPath: `id`, index: `topicId`)
  - `activityPlanItems` (keyPath: `id`, indexes: `topicId`, `status`)
  - `settings` (keyPath: `id`)

#### localStorage
- `focus.activeProfile`: ID do perfil ativo
- `focus.profiles`: Lista de perfis (JSON)
- `focus.completedTopics`: IDs de tópicos completados (JSON)
- `focus.completedSubtopics`: IDs de subtópicos completados (JSON)

### Modelos de Dados (Types)

| Entidade | Campos Principais |
|----------|------------------|
| `Subject` | id, name, order?, createdAt, updatedAt |
| `Profile` | id, name, avatar?, createdAt, updatedAt |
| `Topic` | id, subjectId, name, order?, description?, createdAt, updatedAt |
| `Subtopic` | id, topicId, name, order?, description?, createdAt, updatedAt |
| `Note` | id, topicId, subtopicId?, title, content, createdAt, updatedAt |
| `MCQQuestion` | id, topicId, subtopicId?, type, prompt, choices[], answerIndex, explanation?, createdAt, updatedAt |
| `OpenQuestion` | id, topicId, subtopicId?, type, prompt, sampleAnswer?, createdAt, updatedAt |
| `StudySession` | id, topicId, subtopicId?, activityType, startedAt, endedAt, durationSec, mode, difficulty? |
| `ReviewSchedule` | id, topicId, subtopicId?, originSessionId, dueAt, status, createdAt |
| `ReviewAttempt` | id, scheduleId, correctCount, questionCount, accuracy, durationSec, completedAt |
| `QuestionHistoryEntry` | id, topicId, subtopicId?, sessionId?, correctCount, wrongCount, blankCount, notes?, createdAt |
| `ActivityPlanItem` | id, topicId, subtopicId?, title, teacherName?, materialType, targetCount, completedCount, status, createdAt, updatedAt |
| `Settings` | pomodoroMinutes, shortBreakMinutes, longBreakMinutes, dailyGoalMinutes, enableSounds, theme |

### Arquitetura Atual

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
├─────────────────────────────────────────┤
│  Pages → Store (Zustand) → Storage      │
│                    ↓                    │
│         IndexedDB + localStorage        │
└─────────────────────────────────────────┘
```

- **Frontend-only** (React + Vite)
- **Sem backend**
- **Dados 100% locais**
- **Perfis são apenas locais** (sem autenticação real)

---

## 🎯 Objetivos da Evolução

1. **Autenticação de Usuários**
   - Página de login e cadastro
   - Senhas hasheadas (bcrypt)
   - Tokens JWT para sessões

2. **Sincronização Remota**
   - Dados salvos no Turso (SQLite remoto)
   - Sincronização bidirecional
   - Suporte a modo offline

3. **Manter Compatibilidade**
   - IndexedDB continua como cache local
   - Experiência offline-first preservada
   - Migração suave de dados existentes

---

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Páginas   │  │   Store     │  │   Serviços          │ │
│  │  (React)    │  │  (Zustand)  │  │  (API Client)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              Storage Layer (Abstração)                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │ │
│  │  │  IndexedDB  │  │ localStorage│  │  API Client  │  │ │
│  │  │  (Cache)    │  │  (Session)  │  │  (Turso)     │  │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API Server)                      │
│              (Vercel Functions / Express)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │   CRUD      │  │   Sync              │ │
│  │  Routes     │  │  Routes     │  │  Routes             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              Database Layer                            │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │         Turso (SQLite Remoto)                   │  │ │
│  │  │  - users, sessions                              │  │ │
│  │  │  - subjects, topics, subtopics                  │  │ │
│  │  │  - notes, questions                             │  │ │
│  │  │  - study_sessions, review_schedules/attempts    │  │ │
│  │  │  - question_history, activity_plan_items        │  │ │
│  │  │  - settings, completed_items                    │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados Turso

### Tabela: `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `sessions`
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### Tabela: `subjects`
```sql
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  order_num INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `topics`
```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  name TEXT NOT NULL,
  order_num INTEGER,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `subtopics`
```sql
CREATE TABLE subtopics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  name TEXT NOT NULL,
  order_num INTEGER,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `notes`
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `questions`
```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  type TEXT NOT NULL CHECK(type IN ('mcq', 'open')),
  prompt TEXT NOT NULL,
  choices TEXT, -- JSON array para MCQ
  answer_index INTEGER,
  explanation TEXT,
  sample_answer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `study_sessions`
```sql
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  activity_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  mode TEXT NOT NULL,
  difficulty INTEGER,
  created_at TEXT NOT NULL
);
```

### Tabela: `review_schedules`
```sql
CREATE TABLE review_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  origin_session_id TEXT NOT NULL REFERENCES study_sessions(id),
  due_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'overdue')),
  created_at TEXT NOT NULL
);
```

### Tabela: `review_attempts`
```sql
CREATE TABLE review_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  schedule_id TEXT NOT NULL REFERENCES review_schedules(id),
  correct_count INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  duration_sec INTEGER NOT NULL,
  completed_at TEXT NOT NULL
);
```

### Tabela: `question_history`
```sql
CREATE TABLE question_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  session_id TEXT REFERENCES study_sessions(id),
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  blank_count INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
```

### Tabela: `activity_plan_items`
```sql
CREATE TABLE activity_plan_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  subtopic_id TEXT REFERENCES subtopics(id),
  title TEXT NOT NULL,
  teacher_name TEXT,
  material_type TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Tabela: `settings`
```sql
CREATE TABLE settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  pomodoro_minutes INTEGER NOT NULL DEFAULT 25,
  short_break_minutes INTEGER NOT NULL DEFAULT 5,
  long_break_minutes INTEGER NOT NULL DEFAULT 15,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 120,
  enable_sounds INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'dark'
);
```

### Tabela: `completed_items`
```sql
CREATE TABLE completed_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK(item_type IN ('topic', 'subtopic')),
  completed_at TEXT NOT NULL,
  UNIQUE(user_id, item_id)
);
```

---

## 📦 Dependências Necessárias

### Backend
```json
{
  "@libsql/client": "^0.6.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "express": "^4.18.0" // ou usar Vercel Functions
}
```

### Frontend (já existentes)
```json
{
  "zustand": "^4.4.7",
  "idb": "^8.0.0",
  "react-router-dom": "^6.20.0",
  "zod": "^3.22.4"
}
```

---

## 📝 Variáveis de Ambiente (.env)

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# App
VITE_API_URL=/api
```

---

## 🚀 Plano de Implementação por Fases

### FASE 1: Backend API + Autenticação

**Tarefas:**
1. Configurar projeto backend (Vercel Functions ou Express)
2. Instalar dependências: `@libsql/client`, `bcrypt`, `jsonwebtoken`
3. Criar schema do banco Turso (SQL migrations)
4. Implementar rotas de autenticação:
   - `POST /api/auth/register` - Cadastro
   - `POST /api/auth/login` - Login
   - `POST /api/auth/logout` - Logout
   - `GET /api/auth/me` - Verificar token
5. Middleware de autenticação (JWT verification)

**Arquivos a criar:**
- `api/auth/register.ts`
- `api/auth/login.ts`
- `api/auth/logout.ts`
- `api/auth/me.ts`
- `api/middleware/auth.ts`
- `api/db/turso.ts`
- `api/db/migrations/001_initial.sql`

---

### FASE 2: Páginas de Login/Cadastro

**Tarefas:**
1. Criar página [`LoginPage.tsx`](src/pages/LoginPage.tsx)
2. Criar página [`RegisterPage.tsx`](src/pages/RegisterPage.tsx)
3. Atualizar rotas no [`App.tsx`](src/App.tsx)
4. Criar componente de proteção de rotas (`ProtectedRoute`)
5. Estilizar com Tailwind (seguir padrão atual)

**Arquivos a criar/modificar:**
- `src/pages/LoginPage.tsx` (novo)
- `src/pages/RegisterPage.tsx` (novo)
- `src/components/ProtectedRoute.tsx` (novo)
- `src/App.tsx` (modificar)

---

### FASE 3: Serviço de API

**Tarefas:**
1. Criar [`src/services/apiService.ts`](src/services/apiService.ts)
2. Funções para cada entidade (CRUD)
3. Interceptor para adicionar JWT token
4. Tratamento de erros e refresh token

**Arquivos a criar:**
- `src/services/apiService.ts`
- `src/services/authService.ts`

---

### FASE 4: Sincronização de Dados

**Tarefas:**
1. Criar [`src/services/syncService.ts`](src/services/syncService.ts)
2. Implementar sync bidirecional
3. Estratégia de resolução de conflitos (última escrita vence)
4. Queue de operações offline
5. Atualizar [`src/store/index.ts`](src/store/index.ts) para usar sync

**Arquivos a criar/modificar:**
- `src/services/syncService.ts` (novo)
- `src/services/offlineQueue.ts` (novo)
- `src/store/index.ts` (modificar)
- `src/data/storage.ts` (modificar)

---

### FASE 5: Migração e Testes

**Tarefas:**
1. Script de migração de dados locais para Turso
2. Testes de autenticação
3. Testes de sincronização
4. Testes offline/online

**Arquivos a criar:**
- `src/services/migrationService.ts`
- `src/test/auth.test.ts`
- `src/test/sync.test.ts`

---

### FASE 6: Atualizações Finais

**Tarefas:**
1. Atualizar sistema de perfis (vincular a usuários)
2. Atualizar documentação
3. Configurar variáveis de ambiente
4. Deploy

---

## 🔄 Fluxo de Dados

### Login
```
Frontend → POST /api/auth/login
         → Backend valida credenciais
         → Gera JWT
         → Frontend armazena JWT em localStorage
         → Frontend carrega dados do Turso
         → Atualiza IndexedDB com dados do servidor
```

### Operação CRUD (Online)
```
Frontend → Atualiza IndexedDB (cache local)
         → Envia requisição para API
         → Backend atualiza Turso
         → Resposta confirma sucesso
```

### Operação CRUD (Offline)
```
Frontend → Atualiza IndexedDB (cache local)
         → Adiciona operação à queue offline
         → [Ao reconectar] → Sincroniza queue com Turso
```

### Sincronização
```
Ao fazer login:
1. Buscar dados do Turso
2. Comparar timestamps (updated_at)
3. Resolver conflitos (última escrita vence)
4. Atualizar IndexedDB com dados do servidor
```

---

## ⚠️ Considerações Importantes

### Segurança
- Senhas hasheadas com bcrypt (salt rounds: 10)
- JWT com expiração (7 dias)
- Validação de entrada em todas as rotas
- Rate limiting para prevenir brute force

### Performance
- IndexedDB como cache local (leitura rápida)
- Sync assíncrono (não bloqueia UI)
- Paginação para listas grandes
- Índices otimizados no Turso

### Confiabilidade
- Queue de operações offline
- Retry automático com backoff exponencial
- Logs de erros para debugging
- Backup automático (export)

### Experiência do Usuário
- Login rápido (JWT em localStorage)
- Transição suave entre online/offline
- Feedback visual de status de sync
- Migração opcional de dados locais

---

## 📊 Métricas de Sucesso

- [ ] Usuário consegue se cadastrar
- [ ] Usuário consegue fazer login
- [ ] Dados são salvos no Turso
- [ ] Sincronização funciona bidirecionalmente
- [ ] App funciona offline
- [ ] Dados existentes podem ser migrados

---

## 🔗 Referências

- [Turso Documentation](https://docs.turso.tech)
- [libSQL Client](https://github.com/tursodatabase/libsql-client-ts)
- [JWT.io](https://jwt.io)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
