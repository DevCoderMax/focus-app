# 📖 FOCUS - Guia do Usuário

## Introdução

FOCUS é uma plataforma de estudos minimalista que ajuda você a:
- Organizar conteúdo por matérias e temas
- Registrar sessões de estudo
- Revisar conteúdo em intervalos otimizados
- Acompanhar seu progresso

## Interface Principal

```
┌────────────────────────────────────────────────────────────┐
│  FOCUS                                         [Settings]  │
├───────────┬────────────────────────────────────────────────┤
│           │                                                │
│ Dashboard │  📊 Dashboard                                 │
│ Matérias  │                                                │
│ Anotações │  Tempo estudado hoje: 45 min                  │
│ Questões  │  Sequência: 7 dias                            │
│ Revisões  │  Sessões esta semana: 12                      │
│ Sessão    │  Precisão média: 85%                          │
│ Config    │                                                │
│           │  [Gráfico de barras - últimos 7 dias]        │
│           │                                                │
│           │  Temas que precisam de atenção:               │
│           │  • Funções Quadráticas (72%)                  │
│           │  • Estequiometria (68%)                       │
│           │                                                │
└───────────┴────────────────────────────────────────────────┘
```

## Fluxo de Uso Típico

### 1. Configuração Inicial

#### Criar Matéria
```
Matérias > [+ Nova Matéria]

┌─────────────────────────────────┐
│ Nova Matéria                    │
├─────────────────────────────────┤
│                                 │
│ Nome da matéria:                │
│ [Matemática____________]        │
│                                 │
│ [Criar]  [Cancelar]            │
└─────────────────────────────────┘
```

#### Adicionar Tema
```
Matemática > [+ Tema]

┌─────────────────────────────────┐
│ Novo Tema                       │
├─────────────────────────────────┤
│                                 │
│ Nome do tema:                   │
│ [Funções Quadráticas____]       │
│                                 │
│ Descrição (opcional):           │
│ [Estudo completo de funções__]  │
│ [do segundo grau___________]    │
│                                 │
│ [Criar]  [Cancelar]            │
└─────────────────────────────────┘
```

### 2. Adicionar Conteúdo

#### Criar Anotação
```
Anotações > [+ Nova Anotação]

┌──────────────────────────────────────┐
│ Nova Anotação                        │
├──────────────────────────────────────┤
│                                      │
│ Tema: [Funções Quadráticas ▼]       │
│                                      │
│ Título:                              │
│ [Fórmula de Bhaskara_________]       │
│                                      │
│ Conteúdo (Markdown):                 │
│ ┌──────────────────────────────┐    │
│ │ # Fórmula de Bhaskara        │    │
│ │                              │    │
│ │ A fórmula serve para...      │    │
│ │ x = (-b ± √Δ) / 2a          │    │
│ └──────────────────────────────┘    │
│                                      │
│ [Preview] [Salvar] [Cancelar]       │
└──────────────────────────────────────┘
```

#### Adicionar Questão
```
Questões > [+ Nova Questão]

┌──────────────────────────────────────┐
│ Nova Questão                         │
├──────────────────────────────────────┤
│                                      │
│ Tema: [Funções Quadráticas ▼]       │
│                                      │
│ Tipo: ⦿ Múltipla Escolha            │
│       ○ Discursiva                   │
│                                      │
│ Enunciado:                           │
│ [Qual é o valor de Δ na equação___] │
│ [x² - 5x + 6 = 0?______________]    │
│                                      │
│ Alternativas:                        │
│ A) [1_____________________] ✓        │
│ B) [5_____________________]          │
│ C) [11____________________]          │
│ D) [25____________________]          │
│                                      │
│ Explicação (opcional):               │
│ [Δ = b² - 4ac = 25 - 24 = 1____]   │
│                                      │
│ [Salvar] [Cancelar]                 │
└──────────────────────────────────────┘
```

### 3. Estudar

#### Iniciar Sessão
```
Sessão > [Novo Estudo]

┌──────────────────────────────────────┐
│ Nova Sessão de Estudo                │
├──────────────────────────────────────┤
│                                      │
│ Tema: [Funções Quadráticas ▼]       │
│                                      │
│ Modo:                                │
│ ⦿ Pomodoro (25 min)                 │
│ ○ Timer Livre                        │
│ ○ Contagem Regressiva                │
│                                      │
│ [Iniciar]                            │
└──────────────────────────────────────┘

→ Modo Foco Ativado ↓

┌──────────────────────────────────────┐
│                                      │
│                                      │
│                                      │
│          Funções Quadráticas         │
│                                      │
│              25:00                   │
│                                      │
│         [Pausar] [Finalizar]        │
│                                      │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

#### Finalizar Sessão
```
┌──────────────────────────────────────┐
│ Sessão Concluída! 🎉                 │
├──────────────────────────────────────┤
│                                      │
│ Tempo estudado: 25 minutos           │
│                                      │
│ Como foi a dificuldade?              │
│                                      │
│ ○ ○ ○ ⦿ ○  (4/5)                   │
│                                      │
│ ✓ Revisões criadas para:             │
│   • 03/02 (7 dias)                   │
│   • 11/02 (15 dias)                  │
│                                      │
│ [Novo Estudo] [Ver Dashboard]       │
└──────────────────────────────────────┘
```

### 4. Revisar

#### Visualizar Revisões
```
Revisões

┌──────────────────────────────────────┐
│ Suas Revisões                        │
├──────────────────────────────────────┤
│                                      │
│ HOJE (3)                            │
│ ┌────────────────────────────────┐  │
│ │ Funções Quadráticas             │  │
│ │ 8 questões • Criado em 20/01   │  │
│ │              [Iniciar Revisão] │  │
│ └────────────────────────────────┘  │
│                                      │
│ ATRASADAS (1) 🔴                    │
│ ┌────────────────────────────────┐  │
│ │ Cinemática                      │  │
│ │ 5 questões • Atrasado 2 dias   │  │
│ │              [Iniciar Revisão] │  │
│ └────────────────────────────────┘  │
│                                      │
│ FUTURAS (12)                        │
│ [Ver calendário]                    │
└──────────────────────────────────────┘
```

#### Realizar Revisão
```
→ Modo Revisão ↓

Questão 1 de 8

┌──────────────────────────────────────┐
│                                      │
│ Qual é o valor de Δ (delta) na      │
│ equação x² - 5x + 6 = 0?            │
│                                      │
│ A) 1                                 │
│ B) 5                                 │
│ C) 11                                │
│ D) 25                                │
│                                      │
│ [Responder]                          │
│                                      │
│              [1/8]                   │
└──────────────────────────────────────┘

→ Após responder ↓

┌──────────────────────────────────────┐
│                                      │
│ ✓ Correto!                          │
│                                      │
│ Sua resposta: A) 1                   │
│                                      │
│ Explicação:                          │
│ Δ = b² - 4ac = (-5)² - 4(1)(6)     │
│ Δ = 25 - 24 = 1                     │
│                                      │
│ [Próxima questão]                    │
│                                      │
│              [1/8]                   │
└──────────────────────────────────────┘
```

#### Resultado da Revisão
```
┌──────────────────────────────────────┐
│ Revisão Concluída! 🎯               │
├──────────────────────────────────────┤
│                                      │
│ Funções Quadráticas                  │
│                                      │
│ Acertos: 7 / 8                       │
│ Precisão: 87.5%                      │
│                                      │
│ Status: ✓ Concluída                 │
│                                      │
│ Próxima revisão:                     │
│ Não agendada (bom desempenho!)       │
│                                      │
│ [Ver Dashboard] [Nova Revisão]      │
└──────────────────────────────────────┘
```

## Funcionalidades Avançadas

### Backup e Restauração

#### Exportar
```
Configurações > Backup & Restauração

┌──────────────────────────────────────┐
│ Exportar dados                       │
├──────────────────────────────────────┤
│                                      │
│ Faça backup de todos os seus dados   │
│ em formato JSON.                     │
│                                      │
│ [📥 Exportar Backup]                │
│                                      │
│ → focus-backup-2024-01-27.json      │
└──────────────────────────────────────┘
```

#### Importar
```
┌──────────────────────────────────────┐
│ Importar dados                       │
├──────────────────────────────────────┤
│                                      │
│ Modo:                                │
│ ⦿ Mesclar (adicionar novos)         │
│ ○ Substituir (deletar e importar)   │
│                                      │
│ [📤 Escolher Arquivo]               │
│                                      │
│ ✓ Arquivo selecionado:              │
│   focus-backup-2024-01-27.json      │
│                                      │
│ Resumo:                              │
│ • 3 matérias                         │
│ • 8 temas                            │
│ • 24 questões                        │
│ • 15 sessões de estudo               │
│                                      │
│ [Confirmar] [Cancelar]              │
└──────────────────────────────────────┘
```

### Estatísticas Detalhadas

```
Dashboard > Ver mais

┌──────────────────────────────────────┐
│ Estatísticas Completas               │
├──────────────────────────────────────┤
│                                      │
│ ESTA SEMANA                          │
│ • 12 sessões                         │
│ • 5h 20min estudados                 │
│ • Meta diária: 2h (atingido 6/7)    │
│                                      │
│ ESTE MÊS                             │
│ • 48 sessões                         │
│ • 21h 15min estudados                │
│ • Streak atual: 12 dias              │
│                                      │
│ REVISÕES                             │
│ • Concluídas: 23                     │
│ • Atrasadas: 1                       │
│ • Precisão média: 85%                │
│                                      │
│ TOP 3 MATÉRIAS                       │
│ 1. Matemática - 8h 20min             │
│ 2. Física - 6h 45min                 │
│ 3. Química - 5h 10min                │
│                                      │
└──────────────────────────────────────┘
```

## Dicas de Uso

### 1. Organização Eficiente
- Crie matérias amplas (ex: Matemática)
- Divida em temas específicos (ex: Funções, Geometria)
- Use descrições para contexto

### 2. Questões de Qualidade
- Seja específico nos enunciados
- Adicione explicações detalhadas
- Varie o nível de dificuldade

### 3. Sessões de Estudo
- Use Pomodoro para foco máximo
- Avalie a dificuldade honestamente
- Faça pausas regulares

### 4. Sistema de Revisões
- Não pule revisões atrasadas
- Priorize temas com baixa precisão
- Refaça questões erradas

### 5. Backup Regular
- Exporte seus dados semanalmente
- Guarde backups em nuvem (Drive, Dropbox)
- Teste a importação periodicamente

## Atalhos de Teclado (Futuro)

```
⌘/Ctrl + K        Busca global
⌘/Ctrl + N        Nova matéria/tema
⌘/Ctrl + S        Salvar
Esc               Fechar modal
Enter             Confirmar ação
↑↓                Navegar lista
```

## Solução de Problemas

### Dados não salvam
1. Verifique se o navegador permite IndexedDB
2. Limpe o cache e recarregue
3. Tente em modo anônimo

### Revisões não aparecem
1. Certifique-se de ter questões cadastradas
2. Verifique as datas das sessões
3. Recarregue a página

### Performance lenta
1. Faça backup e limpe dados antigos
2. Feche outras abas do navegador
3. Use build de produção (`npm run build`)

## Glossário

- **Matéria**: Disciplina ampla (ex: Matemática)
- **Tema**: Tópico específico dentro de uma matéria
- **Sessão**: Período de estudo cronometrado
- **Revisão**: Teste de conhecimento agendado
- **Streak**: Dias consecutivos de estudo
- **Accuracy**: Percentual de acertos nas revisões

---

**Bons estudos! 📚**
