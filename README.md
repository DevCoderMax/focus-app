# FOCUS - Plataforma de Estudos Minimalista

**FOCUS** é uma plataforma local de organização de estudos, revisões, sessões, questões e acompanhamento de progresso. A versão open-source roda como **frontend React + API Python local**, salvando os dados em um banco SQLite no próprio ambiente do usuário.

A proposta continua minimalista: interface em preto e branco, baixa distração e foco em estudo estruturado.

## Características

- **Interface minimalista** em preto, branco e tons de cinza.
- **API local em Python/FastAPI** como fonte de verdade dos dados.
- **SQLite local** criado automaticamente em `backend/data/focus-local.db`.
- **Perfis locais** para separar dados de estudo por pessoa/contexto.
- **CRUD de matérias, tópicos e subtópicos**.
- **Importação de pacotes JSON** para criar estruturas de estudo rapidamente.
- **Guia visual de pacote JSON** em `/package-guide`.
- **Backup e restauração** por JSON.
- **Temporizador e sessões de estudo**.
- **Histórico de questões e progresso**.
- **React + TypeScript + Vite + TailwindCSS** no frontend.

## O Que Esta Versão Não Inclui

Esta versão open-source **não inclui**:

- login/autenticação;
- billing/pagamentos;
- planos/entitlements;
- sync cloud entre dispositivos;
- backend Node/Express/Vercel Functions;
- IndexedDB como banco principal.

Essas partes foram removidas/separadas para manter o projeto open-source focado em uso local.

## Arquitetura

```txt
focus-app/
├── backend/                    # API local FastAPI
│   ├── app/
│   │   ├── core/               # Configuração e dependências locais
│   │   ├── db/                 # Cliente SQLite local
│   │   ├── routes/             # Rotas da API local
│   │   │   └── local.py
│   │   └── main.py
│   ├── data/                   # Banco local ignorado pelo git
│   ├── requirements.txt
│   └── README.md
├── src/
│   ├── components/             # Componentes reutilizáveis
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Subjects.tsx
│   │   ├── PackageGuide.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── services/               # Clientes/API e regras de importação/exportação
│   │   ├── apiService.ts
│   │   ├── importExportService.ts
│   │   └── schedulerService.ts
│   ├── store/                  # Cache de UI/estado com Zustand
│   ├── types/                  # Tipos TypeScript
│   ├── utils/                  # Utilitários
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Como Rodar

### Pré-requisitos

- Node.js 18+
- npm
- Python 3.12+ recomendado

### Instalação

```bash
cd focus-app
npm install
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

### Desenvolvimento

```bash
npm run dev
```

Esse comando inicia:

- frontend Vite em `http://localhost:5173`;
- API FastAPI em `http://localhost:8000`.

O Vite encaminha chamadas `/api` para a API local via proxy.

### Banco Local

Por padrão, o SQLite é criado em:

```txt
backend/data/focus-local.db
```

Esse diretório é ignorado pelo git.

Para usar outro caminho:

```bash
FOCUS_DB_PATH=/caminho/para/focus-local.db npm run dev
```

## API Local

A API local usa um usuário interno fixo (`local-user`) e não exige autenticação.

Os dados são separados por perfil. O frontend envia o perfil ativo em todas as chamadas CRUD usando o header:

```http
X-Profile-Id: <id-do-perfil>
```

Se nenhum perfil for selecionado, a API cria/usa o perfil padrão `default`.

### Rotas Principais

- `GET /api/app-state`
- `GET /api/profiles`
- `POST /api/profiles`
- `PUT /api/profiles/:id`
- `DELETE /api/profiles/:id`
- `GET /api/subjects`
- `POST /api/subjects`
- `PUT /api/subjects/:id`
- `DELETE /api/subjects/:id`
- `PUT /api/subjects/reorder`
- `GET /api/topics`
- `POST /api/topics`
- `PUT /api/topics/:id`
- `DELETE /api/topics/:id`
- `GET /api/subtopics`
- `POST /api/subtopics`
- `PUT /api/subtopics/:id`
- `DELETE /api/subtopics/:id`
- `GET /api/settings`
- `PUT /api/settings`
- `PUT /api/completed-items/:itemType/:itemId`
- `POST /api/data/import`

Também existem rotas CRUD genéricas para notas, questões, sessões, revisões, histórico de questões e plano de atividades.

## Importar Pacotes JSON

Na página **Matérias**, clique em **Importar Pacote** para colar ou enviar um arquivo JSON.

O modal possui um botão **Ver guia do JSON**, que abre a página:

```txt
/package-guide
```

Formato mínimo:

```json
{
  "subjects": [
    {
      "name": "Direito Constitucional",
      "topics": [
        { "name": "Princípios fundamentais" },
        { "name": "Direitos e garantias fundamentais" }
      ]
    }
  ]
}
```

Formato completo com subtópicos:

```json
{
  "subjects": [
    {
      "name": "Matemática",
      "topics": [
        {
          "name": "Álgebra",
          "description": "Equações, expressões e funções algébricas.",
          "subtopics": [
            {
              "name": "Equações do 2º grau",
              "description": "Forma ax² + bx + c = 0, delta e raízes."
            },
            {
              "name": "Produtos notáveis"
            }
          ]
        }
      ]
    }
  ]
}
```

Regras principais:

- o arquivo precisa ser JSON válido;
- a raiz deve conter `subjects`;
- cada matéria precisa ter `name`;
- cada tópico precisa ter `name`;
- `topics`, `subtopics` e `description` são opcionais conforme o nível.

## Backup e Restauração

Em **Configurações**, é possível exportar/importar backup completo.

O backup inclui:

- matérias;
- tópicos;
- subtópicos;
- notas;
- questões;
- sessões de estudo;
- revisões;
- histórico de questões;
- plano de atividades;
- configurações.

Modos de importação:

1. **Substituir:** remove os dados do perfil ativo e importa apenas o arquivo.
2. **Mesclar:** adiciona/atualiza os dados importados sem limpar tudo antes.

## Modelos Principais

### Subject

```ts
{
  id: string
  name: string
  order?: number
  createdAt: string
  updatedAt: string
}
```

### Topic

```ts
{
  id: string
  subjectId: string
  name: string
  order?: number
  description?: string
  createdAt: string
  updatedAt: string
}
```

### Subtopic

```ts
{
  id: string
  topicId: string
  name: string
  order?: number
  description?: string
  createdAt: string
  updatedAt: string
}
```

### StudySession

```ts
{
  id: string
  topicId: string
  subtopicId?: string
  activityType: 'lesson' | 'questions' | 'lesson_questions'
  startedAt: string
  endedAt: string
  durationSec: number
  mode: 'pomodoro' | 'free' | 'countdown'
  difficulty?: 1 | 2 | 3 | 4 | 5
  createdAt: string
  updatedAt: string
}
```

### Settings

```ts
{
  id: string
  pomodoroMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  dailyGoalMinutes: number
  enableSounds: boolean
  theme: 'dark' | 'light'
  updatedAt: string
}
```

## Design System

### Paleta

- Preto puro: `#000000`
- Branco puro: `#FFFFFF`
- Cinzas para hierarquia visual

### Princípios

1. Zero distrações.
2. Contraste alto.
3. Espaçamento generoso.
4. Microinterações discretas.
5. Conteúdo primeiro.

## Stack Tecnológica

- **Frontend:** React 18 + TypeScript
- **Build:** Vite
- **Roteamento:** React Router v6
- **Estado:** Zustand
- **Estilo:** TailwindCSS
- **Backend local:** FastAPI
- **Banco:** SQLite local
- **Validação:** Zod
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Testes:** Vitest + Testing Library + jsdom

## Scripts Disponíveis

```bash
npm run dev      # Frontend Vite + API FastAPI local
npm run build    # Build de produção do frontend
npm run preview  # Preview do build
npm test         # Rodar testes
```

## Testes

```bash
npm test
npm test -- --coverage
```

## Status Das Funcionalidades

| Funcionalidade | Status |
| --- | --- |
| Dashboard | Implementado |
| Perfis locais | Implementado |
| CRUD Matérias/Tópicos/Subtópicos | Implementado |
| Importar pacote JSON | Implementado |
| Guia de pacote JSON | Implementado |
| Exportar/Importar backup | Implementado |
| Configurações | Implementado |
| Temporizador/Sessões | Implementado |
| Histórico de questões | Implementado |
| Revisões | Em evolução |
| Anotações e banco de questões | Em evolução |

## Próximos Passos

- Melhorar cobertura dos endpoints Python.
- Evoluir anotações e banco de questões.
- Refinar revisão espaçada e runner de revisões.
- Avaliar empacotamento desktop/mobile no futuro.
- Reintroduzir sync apenas quando houver arquitetura desktop/mobile apropriada.

## Licença

MIT License - use à vontade.

## Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro.

---

**FOCUS** - Estude. Revise. Evolua.
