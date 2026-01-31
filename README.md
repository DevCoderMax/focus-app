# FOCUS - Plataforma de Estudos Minimalista

**FOCUS** é uma aplicação web offline-first para organização de estudos, revisões inteligentes e acompanhamento de progresso. Design minimalista em preto e branco, focado em eliminar distrações.

## 🎯 Características

- ✨ **Minimalismo extremo** - UI em preto e branco apenas
- 📦 **Offline-first** - Todos os dados armazenados localmente (IndexedDB)
- 🔄 **Revisões automáticas** - Sistema de espaçamento de 7 e 15 dias
- 📊 **Analytics simples** - Acompanhe tempo, streak e desempenho
- 💾 **Backup completo** - Exportação/importação via JSON
- ⚡ **Performático** - React + TypeScript + Vite

## 🏗️ Arquitetura

```
focus-app/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Layout.tsx
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── pages/           # Páginas principais
│   │   ├── Dashboard.tsx
│   │   ├── Subjects.tsx
│   │   ├── Settings.tsx
│   │   └── Placeholder.tsx
│   ├── data/            # Camada de dados
│   │   ├── storage.ts   # IndexedDB wrapper
│   │   └── mockData.ts  # Dados de exemplo
│   ├── services/        # Lógica de negócio
│   │   ├── schedulerService.ts
│   │   └── importExportService.ts
│   ├── store/           # Estado global (Zustand)
│   │   └── index.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utilitários
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

1. **Instalar dependências:**
```bash
cd focus-app
npm install
```

2. **Iniciar servidor de desenvolvimento:**
```bash
npm run dev
```

3. **Acessar aplicação:**
Abra [http://localhost:5173](http://localhost:5173) no navegador

### Build para produção

```bash
npm run build
npm run preview
```

## 📊 Modelos de Dados

### Subject (Matéria)
```typescript
{
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
```

### Topic (Tema)
```typescript
{
  id: string
  subjectId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}
```

### Note (Anotação)
```typescript
{
  id: string
  topicId: string
  title: string
  content: string (markdown)
  createdAt: string
  updatedAt: string
}
```

### Question (Questão)
```typescript
// MCQ (Múltipla escolha)
{
  id: string
  topicId: string
  type: 'mcq'
  prompt: string
  choices: string[]
  answerIndex: number
  explanation?: string
}

// Open (Discursiva)
{
  id: string
  topicId: string
  type: 'open'
  prompt: string
  sampleAnswer?: string
}
```

### StudySession (Sessão de Estudo)
```typescript
{
  id: string
  topicId: string
  startedAt: string
  endedAt: string
  durationSec: number
  mode: 'pomodoro' | 'free' | 'countdown'
  difficulty: 1 | 2 | 3 | 4 | 5
}
```

### ReviewSchedule (Revisão Agendada)
```typescript
{
  id: string
  topicId: string
  originSessionId: string
  dueAt: string
  status: 'pending' | 'completed' | 'overdue'
  createdAt: string
}
```

## 🎨 Design System

### Paleta de Cores

- **Preto puro:** `#000000` (fundo)
- **Branco puro:** `#FFFFFF` (texto e botões primários)
- **Cinzas:** Apenas para contraste e hierarquia visual

### Tipografia

- **Sans-serif:** Space Grotesk (títulos e UI)
- **Monospace:** JetBrains Mono (código e dados)

### Princípios

1. **Zero distrações** - Nada de cores, animações desnecessárias
2. **Contraste máximo** - Legibilidade perfeita
3. **Espaçamento generoso** - Respiro visual
4. **Transições suaves** - Microinterações discretas

## 🔄 Sistema de Revisões

### Criação Automática

Ao finalizar uma sessão de estudo, o sistema automaticamente cria:
- **Revisão 1:** 7 dias após a sessão
- **Revisão 2:** 15 dias após a sessão

### Lógica de Reforço

Baseado no desempenho nas revisões:

- **≥ 80% de acerto:** Revisão concluída ✓
- **50-79% de acerto:** Nova revisão em +7 dias
- **< 50% de acerto:** Reforços em +3 e +7 dias

## 💾 Backup & Restauração

### Exportar

```javascript
// Gera arquivo JSON com todos os dados
{
  meta: {
    app: "FOCUS",
    version: "1.0.0",
    exportedAt: "2024-01-27T..."
  },
  data: {
    subjects: [...],
    topics: [...],
    notes: [...],
    questions: [...],
    studySessions: [...],
    reviewSchedules: [...],
    reviewAttempts: [...],
    settings: {...}
  }
}
```

### Importar

Dois modos:

1. **SUBSTITUIR:** Deleta tudo e importa apenas os dados do arquivo
2. **MESCLAR:** 
   - IDs novos → inserir
   - IDs existentes → sobrescrever se `updatedAt` for mais recente

## 🧪 Testes

```bash
# Rodar testes
npm test

# Testes com coverage
npm test -- --coverage
```

## 📝 Status das Funcionalidades

| Funcionalidade | Status |
|---------------|--------|
| ✅ Dashboard | Implementado |
| ✅ CRUD Matérias/Temas | Implementado |
| ✅ Exportar/Importar | Implementado |
| ✅ Configurações | Implementado |
| ⏳ Anotações | Em desenvolvimento |
| ⏳ Banco de Questões | Em desenvolvimento |
| ⏳ Sistema de Revisões | Em desenvolvimento |
| ⏳ Sessão de Estudo | Em desenvolvimento |

## 🛠️ Stack Tecnológica

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Roteamento:** React Router v6
- **Estado:** Zustand
- **Estilo:** TailwindCSS (monocromático)
- **Banco:** IndexedDB (via idb)
- **Validação:** Zod
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Testes:** Vitest + Testing Library

## 📦 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview do build
npm test         # Rodar testes
```

## 🎯 Próximos Passos

1. **Completar funcionalidades pendentes:**
   - Sistema completo de anotações com markdown
   - Banco de questões com filtros
   - Runner de revisões
   - Sessão de estudo com timer

2. **Melhorias futuras:**
   - PWA (instalável)
   - Modo "Deep Focus" (tela preta + timer)
   - Flashcards estilo Anki
   - Planner semanal
   - Sync entre dispositivos (opcional)

## 📄 Licença

MIT License - Use à vontade!

## 🤝 Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro.

---

**FOCUS** - Estude. Revise. Evolua.
