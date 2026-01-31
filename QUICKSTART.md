# 🚀 Guia de Início Rápido - FOCUS

## Instalação Rápida

```bash
# 1. Entre na pasta do projeto
cd focus-app

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

## Primeiro Uso

Ao abrir a aplicação, você verá o Dashboard vazio. Siga estes passos:

### 1. Criar sua primeira matéria

1. Clique em **"Matérias"** na barra lateral
2. Clique em **"Nova Matéria"**
3. Digite o nome (ex: "Matemática")
4. Clique em **"Criar"**

### 2. Adicionar temas

1. Na matéria criada, clique em **"+ Tema"**
2. Digite o nome do tema (ex: "Funções Quadráticas")
3. Adicione uma descrição opcional
4. Clique em **"Criar"**

### 3. Explorar o Dashboard

- Volte ao Dashboard para ver suas estatísticas
- Inicialmente estará vazio, pois você ainda não estudou

### 4. Configurar temporizadores

1. Vá em **"Configurações"**
2. Ajuste os tempos de Pomodoro conforme preferir
3. Configure sua meta diária de estudo

### 5. Fazer backup dos dados

1. Em **"Configurações"** > **"Backup & Restauração"**
2. Clique em **"Exportar Backup"**
3. Um arquivo JSON será baixado

## Dados de Exemplo (Mock)

Para testar com dados já preenchidos, você pode usar o mock:

1. Abra o console do navegador (F12)
2. Execute:

```javascript
// No console do navegador
import { generateMockData } from './src/data/mockData';

// Gerar dados
const mockData = generateMockData();

// Adicionar ao storage
// (implemente um script de seed se necessário)
```

Ou crie um arquivo `seed.ts` na pasta `src/data/`:

```typescript
import { generateMockData } from './mockData';
import * as storage from './storage';

export async function seedDatabase() {
  const data = generateMockData();
  
  await storage.initDB();
  
  // Adicionar subjects
  for (const subject of data.subjects) {
    await storage.add('subjects', subject);
  }
  
  // Adicionar topics
  for (const topic of data.topics) {
    await storage.add('topics', topic);
  }
  
  // Adicionar notes
  for (const note of data.notes) {
    await storage.add('notes', note);
  }
  
  // Adicionar questions
  for (const question of data.questions) {
    await storage.add('questions', question);
  }
  
  // Adicionar study sessions
  for (const session of data.studySessions) {
    await storage.add('studySessions', session);
  }
  
  console.log('✅ Database seeded successfully!');
}
```

Depois execute no console:

```javascript
import { seedDatabase } from './data/seed';
seedDatabase();
```

## Atalhos de Teclado (Futuro)

- `Cmd/Ctrl + K` - Busca global
- `Cmd/Ctrl + N` - Nova matéria/tema
- `Esc` - Fechar modal
- `Enter` - Confirmar ação

## Troubleshooting

### Problemas comuns:

**1. Página em branco**
- Abra o console (F12) e verifique erros
- Certifique-se que executou `npm install`

**2. IndexedDB não funciona**
- Verifique se o navegador suporta IndexedDB
- Tente em modo anônimo
- Limpe o cache do navegador

**3. Dados não salvam**
- Verifique as permissões do navegador
- Teste em outro navegador
- Faça backup antes de limpar dados

**4. Build falha**
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente
- Verifique versões Node.js (18+)

## Recursos Adicionais

- **Documentação completa:** README.md
- **Tipos TypeScript:** src/types/index.ts
- **Componentes:** src/components/
- **Serviços:** src/services/

## Feedback

Encontrou um bug ou tem sugestão? Abra uma issue no repositório!

---

**Bons estudos! 📚**
