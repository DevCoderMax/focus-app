# 📋 FOCUS - Plano de Implementação Completo

## Fase 1: Fundação ✅ COMPLETO

### 1.1 Configuração do Projeto
- [x] Estrutura de pastas
- [x] Configuração Vite + React + TypeScript
- [x] TailwindCSS com paleta monocromática
- [x] React Router para navegação
- [x] Zustand para estado global

### 1.2 Camada de Dados
- [x] Tipos TypeScript completos
- [x] IndexedDB wrapper com idb
- [x] CRUD operations genéricas
- [x] Inicialização de settings padrão

### 1.3 Componentes Base
- [x] Layout com sidebar
- [x] Button component
- [x] Input component
- [x] Estrutura de rotas

### 1.4 Páginas Principais
- [x] Dashboard com estatísticas
- [x] Matérias & Temas (CRUD completo)
- [x] Configurações com backup/restore
- [x] Placeholders para outras páginas

## Fase 2: Funcionalidades Core 🚧 PRÓXIMOS PASSOS

### 2.1 Sistema de Anotações
**Prioridade: ALTA**

Componentes necessários:
- [ ] Editor de Markdown (usar textarea + preview)
- [ ] Lista de anotações por tema
- [ ] Busca em anotações
- [ ] Tags/categorias opcionais

Arquivos a criar:
```
src/pages/Notes.tsx
src/components/MarkdownEditor.tsx
src/components/MarkdownPreview.tsx
src/components/NoteCard.tsx
```

### 2.2 Banco de Questões
**Prioridade: ALTA**

Funcionalidades:
- [ ] CRUD de questões MCQ e Open
- [ ] Filtro por matéria/tema
- [ ] Preview de questões
- [ ] Importação em lote (CSV/JSON)

Arquivos a criar:
```
src/pages/Questions.tsx
src/components/QuestionForm.tsx
src/components/QuestionCard.tsx
src/components/QuestionFilters.tsx
```

### 2.3 Sistema de Revisões
**Prioridade: ALTA**

Funcionalidades:
- [ ] Visualização de revisões (Hoje/Atrasadas/Futuras)
- [ ] Question Runner (tela de foco)
- [ ] Sistema de pontuação
- [ ] Lógica de reforço automático

Arquivos a criar:
```
src/pages/Reviews.tsx
src/pages/ReviewSession.tsx
src/components/QuestionRunner.tsx
src/components/ReviewCalendar.tsx
```

### 2.4 Sessão de Estudo
**Prioridade: MÉDIA**

Funcionalidades:
- [ ] Timer Pomodoro
- [ ] Timer livre
- [ ] Timer regressivo
- [ ] Tela de foco total
- [ ] Seleção de tema
- [ ] Avaliação de dificuldade

Arquivos a criar:
```
src/pages/StudySession.tsx
src/components/Timer.tsx
src/components/FocusMode.tsx
src/services/timerService.ts
```

## Fase 3: Refinamentos 🎨 FUTURO

### 3.1 UX Improvements
- [ ] Atalhos de teclado
- [ ] Busca global (Cmd+K)
- [ ] Drag & drop para reordenar
- [ ] Animações de transição
- [ ] Loading states melhores

### 3.2 Analytics Avançado
- [ ] Gráficos de desempenho por matéria
- [ ] Heatmap de estudo
- [ ] Relatório semanal/mensal
- [ ] Exportação de relatórios

### 3.3 Modo Deep Focus
- [ ] Tela totalmente preta
- [ ] Apenas timer central
- [ ] Sons ambiente (opcional)
- [ ] Modo Zen completo

### 3.4 Flashcards
- [ ] Sistema estilo Anki
- [ ] Spaced repetition
- [ ] Estatísticas de memorização

## Fase 4: PWA & Sync 🌐 LONGO PRAZO

### 4.1 Progressive Web App
- [ ] Service Worker
- [ ] Offline completo
- [ ] Instalável
- [ ] Notificações push

### 4.2 Sincronização (Opcional)
- [ ] Supabase/Firebase backend
- [ ] Sync entre dispositivos
- [ ] Conflict resolution
- [ ] Modo offline-first mantido

## 📊 Estrutura de Implementação Detalhada

### Sistema de Revisões - Fluxo Completo

```typescript
// 1. Criar revisões após sessão
StudySession finalizada
  → schedulerService.createReviewSchedules()
  → Cria ReviewSchedule (7 dias)
  → Cria ReviewSchedule (15 dias)

// 2. Visualizar revisões
ReviewsPage
  → Busca ReviewSchedules por status
  → Agrupa por: Hoje / Atrasadas / Futuras
  → Mostra quantidade de questões disponíveis

// 3. Iniciar revisão
Clicar em "Iniciar Revisão"
  → Busca Questions do topicId
  → Shuffle questions
  → Inicia ReviewSession (tela de foco)

// 4. Durante a revisão
QuestionRunner
  → Mostra 1 questão por vez
  → Registra respostas
  → Calcula accuracy em tempo real
  → Ao finalizar:
    → Cria ReviewAttempt
    → Atualiza ReviewSchedule status
    → schedulerService.createReinforcementReviews()

// 5. Lógica de reforço
Accuracy ≥ 80%
  → Nada (revisão concluída)

Accuracy 50-79%
  → Nova ReviewSchedule (+7 dias)

Accuracy < 50%
  → ReviewSchedule (+3 dias)
  → ReviewSchedule (+7 dias)
```

### Timer Service - Implementação

```typescript
// timerService.ts
export class TimerService {
  private intervalId: number | null = null;
  private startTime: number = 0;
  private elapsedSeconds: number = 0;
  private mode: 'pomodoro' | 'free' | 'countdown';
  
  // Callbacks
  onTick: (seconds: number) => void;
  onComplete: () => void;
  
  start(mode: StudyMode, duration?: number) {
    // Implementação
  }
  
  pause() {
    // Implementação
  }
  
  resume() {
    // Implementação
  }
  
  stop() {
    // Implementação
  }
  
  getElapsed(): number {
    return this.elapsedSeconds;
  }
}
```

## 🧪 Estratégia de Testes

### Testes Unitários
- [x] Helpers/utilities
- [x] Componentes básicos (Button, Input)
- [ ] Storage layer
- [ ] Services (scheduler, import/export)
- [ ] Store (Zustand)

### Testes de Integração
- [ ] Fluxo completo de estudo
- [ ] Sistema de revisões
- [ ] Import/Export

### Testes E2E (Opcional)
- [ ] Fluxo de usuário completo
- [ ] Cypress ou Playwright

## 📝 Checklist de Qualidade

### Performance
- [ ] Lazy loading de rotas
- [ ] Memoização de componentes pesados
- [ ] IndexedDB queries otimizadas
- [ ] Debounce em searches

### Acessibilidade
- [ ] Navegação por teclado completa
- [ ] ARIA labels
- [ ] Alto contraste (já implementado)
- [ ] Screen reader friendly

### SEO & Meta
- [ ] Meta tags adequadas
- [ ] Open Graph
- [ ] Manifest.json para PWA

### Segurança
- [ ] Sanitização de inputs
- [ ] Validação com Zod em todos os forms
- [ ] CSP headers (se necessário)

## 🎯 Prioridades por Impacto

### Impacto ALTO (fazer primeiro)
1. Sistema de Revisões completo
2. Banco de Questões
3. Sessão de Estudo com timer
4. Anotações com markdown

### Impacto MÉDIO
1. Analytics avançado
2. Busca global
3. Atalhos de teclado
4. Flashcards

### Impacto BAIXO
1. PWA
2. Sincronização
3. Temas/cores (manter mono)
4. Sons/notificações

## 📅 Estimativa de Tempo

### MVP Completo (Fase 1 + Fase 2)
- Anotações: 8-12 horas
- Questões: 12-16 horas
- Revisões: 16-20 horas
- Sessão de Estudo: 8-12 horas
- **Total: ~50-60 horas**

### Refinamentos (Fase 3)
- UX improvements: 16-20 horas
- Analytics: 8-12 horas
- Deep Focus: 4-8 horas
- Flashcards: 12-16 horas
- **Total: ~40-56 horas**

### PWA & Sync (Fase 4)
- PWA: 8-12 horas
- Sync: 20-30 horas
- **Total: ~28-42 horas**

## 🚀 Conclusão

O projeto está com uma base sólida implementada. As próximas etapas devem focar em:

1. **Completar Fase 2** - Core features
2. **Testes** - Garantir estabilidade
3. **Refinamento UX** - Polimento
4. **PWA** - Instalabilidade

A arquitetura está preparada para escalar e adicionar novas features sem breaking changes.

---

**Status atual:** ✅ Fase 1 completa | 🚧 Fase 2 iniciando
