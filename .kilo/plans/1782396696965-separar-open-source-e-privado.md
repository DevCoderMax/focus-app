# Plano: Separar Projeto Open-Source E Projeto Privado

## Objetivo

Reorganizar o projeto em dois produtos/repositórios:

- `focus-app`: projeto open-source com frontend Vite + API Python local, sem auth, billing, entitlements, sync cloud ou IndexedDB como banco principal.
- `focus-app-private`: projeto privado em `/home/max/Documentos/GitHub/focus-app-private`, com frontend na raiz + API Python em `backend/`, contendo auth, billing manual, entitlements e futuras integrações privadas.

## Decisões Fechadas

- Criar projeto privado separado, não branch privada.
- Usar cópia filtrada do estado atual para criar `focus-app-private`.
- Excluir da cópia filtrada: `.git`, `.env`, bancos locais, `.venv`, `node_modules`, caches e artefatos gerados.
- Concentrar toda lógica de servidor em Python/FastAPI.
- Express/Node/Vercel functions deixam de ser fonte de verdade.
- Migrar para Python qualquer lógica útil que ainda exista apenas em `api/server.ts` ou `api/*.ts`.
- Remover sync temporariamente dos dois produtos.
- No open-source, remover IndexedDB como banco principal; frontend salva/busca/altera direto na API local.
- No open-source, API Python local salva dados em SQLite.
- Banco SQLite local open-source deve ficar em `backend/data/focus-local.db`, com `backend/data/` ignorado pelo git e override por `FOCUS_DB_PATH`.
- No privado web, API/DB é fonte de verdade; IndexedDB/localStorage só para estado de UI/cache descartável.
- Manter contratos REST parecidos entre open-source e privado: `/api/subjects`, `/api/topics`, `/api/settings`, `/api/profiles`, etc.
- Diferença principal: privado exige auth e adiciona billing/entitlements; open-source usa usuário local interno.
- Open-source sem login deve usar um `local-user` interno no backend para preservar colunas `user_id` e facilitar compatibilidade.
- Dados principais devem ser separados por perfil.
- Adicionar `profile_id` às entidades principais que hoje eram separadas por bancos IndexedDB por perfil.
- Frontend deve enviar perfil ativo em header `X-Profile-Id` em toda chamada CRUD.
- API não deve guardar “perfil ativo” global; ela valida o header e filtra/cria dados com `profile_id`.
- Billing privado inicial será manual, sem gateway real por enquanto.
- Checkout/portal podem continuar retornando `501` até escolha de provedor real.

## Arquitetura Alvo: Open-Source (`focus-app`)

- Frontend Vite/React na raiz.
- API Python/FastAPI em `backend/`.
- SQLite local em `backend/data/focus-local.db`.
- Sem `api/` Node/Express/Vercel functions.
- Sem `backend` privado com auth/billing.
- Sem `Backend/` duplicado.
- Sem login/register/protected routes.
- Sem billing/checkout/portal/webhook/admin grant no código open-source.
- Sem entitlements ou limites de plano.
- Sem sync cloud.
- Sem IndexedDB como fonte de dados.
- Perfis continuam existindo, mas agora são registros da API local.
- Ao selecionar perfil, frontend salva `activeProfileId`, envia `X-Profile-Id` e recarrega os dados daquele perfil.
- API cria perfil default se não existir.
- API usa `local-user` interno para escopo de dados, sem expor autenticação.

## Arquitetura Alvo: Privado (`focus-app-private`)

- Frontend Vite/React na raiz.
- API Python/FastAPI em `backend/`.
- Auth, billing manual, entitlements e admin grant ficam apenas aqui.
- API privada exige usuário autenticado.
- CRUD principal usa os mesmos contratos do open-source, mas filtrando por `user_id` autenticado e `profile_id` ativo.
- Sync cloud fica fora temporariamente.
- Express/Node deve ser removido após migrar para Python o que ainda for necessário.
- Billing inicial mantém provider manual/stub:
  - `GET /api/entitlements`.
  - endpoint/admin para conceder Pro manualmente.
  - checkout/portal retornando `501` enquanto não houver gateway real.

## Ordem De Implementação Recomendada

1. Preparar segurança do estado atual.
   - Verificar `git status --branch --short` no `focus-app`.
   - Notar que o repositório está em detached HEAD e com mudanças não commitadas.
   - Não descartar nem reverter alterações existentes.

2. Criar o projeto privado por cópia filtrada.
   - Criar `/home/max/Documentos/GitHub/focus-app-private` se não existir.
   - Copiar a árvore atual excluindo `.git`, `.env`, bancos locais, `.venv`, `node_modules`, `dist`, caches e arquivos SQLite locais.
   - Inicializar git no privado somente se o usuário solicitar explicitamente.
   - Criar `.gitignore` apropriado no privado antes de qualquer commit futuro.

3. Organizar o backend privado.
   - Manter FastAPI como backend oficial.
   - Migrar para Python rotas/lógicas úteis ainda presentes só em Node/Express/Vercel.
   - Remover `api/server.ts` e funções Node após migração.
   - Implementar ou completar em Python:
     - auth register/login/me/logout;
     - entitlements;
     - billing manual;
     - admin grant Pro;
     - subjects CRUD completo;
     - topics CRUD completo;
     - profiles CRUD;
     - settings CRUD;
     - demais entidades que a UI usa.
   - Não implementar sync agora.

4. Limpar o open-source.
   - Remover auth/login/register/protected route do frontend.
   - Remover billing UI/service/entitlements/plan limits.
   - Remover sync service e chamadas automáticas de sync.
   - Remover IndexedDB como fonte de dados.
   - Substituir store/local storage CRUD por chamadas à API Python local.
   - Manter apenas localStorage para estado de UI, como `activeProfileId`, collapsed state, preferências visuais simples.
   - Remover `api/` Node/Express/Vercel functions.
   - Remover `Backend/` duplicado.
   - Manter/ajustar apenas `backend/` Python local.

5. Ajustar API Python open-source.
   - Remover dependência de auth real.
   - Implementar dependência interna `get_local_user()` ou equivalente, retornando/criando `local-user`.
   - Criar bootstrap/migration para SQLite local.
   - Usar `FOCUS_DB_PATH` com default `backend/data/focus-local.db`.
   - Garantir criação de `backend/data/` em runtime se necessário.
   - Garantir que `backend/data/` esteja no `.gitignore`.
   - Adicionar/usar `profile_id` nas tabelas principais.
   - Ler `X-Profile-Id` em CRUDs principais.
   - Se `X-Profile-Id` ausente, usar/criar perfil default.
   - Validar que o perfil pertence ao `local-user` interno.

6. Alinhar contratos de dados.
   - Escolher um nome canônico no frontend para ordenação.
   - Recomendado: frontend usa `order`, API serializa `order`, banco usa `order_num` internamente.
   - Corrigir conversões `order` <-> `order_num` em todas as rotas.
   - Evitar expor `orderNum` em alguns lugares e `order` em outros.
   - Garantir que `createdAt` e `updatedAt` existam em todas as entidades que os tipos exigem.
   - Corrigir `settings`: API pode armazenar por `user_id/profile_id`, mas resposta ao frontend deve ter formato estável.

7. Ajustar scripts de desenvolvimento.
   - Remover `dev:api` Node.
   - Fazer `npm run dev` subir frontend e API Python, ou documentar comandos separados se mais simples.
   - Vite deve continuar proxyando `/api` para FastAPI local.
   - Garantir que porta do proxy e porta do FastAPI batam.

8. Validar o open-source.
   - Instalar dependências necessárias.
   - Rodar migrations/bootstrap da API local.
   - Subir API Python.
   - Subir frontend.
   - Criar perfil.
   - Selecionar perfil.
   - Criar/editar/deletar matéria.
   - Criar/editar/deletar tópico.
   - Trocar de perfil e confirmar isolamento de dados.
   - Reiniciar app/API e confirmar persistência no SQLite.
   - Rodar `npm run build` e corrigir erros TypeScript.
   - Rodar testes; adicionar `jsdom` ou ajustar config se necessário.

9. Validar o privado.
   - Registrar usuário.
   - Login/me/logout.
   - Criar perfil.
   - CRUD principal com `X-Profile-Id` e auth.
   - Conferir isolamento por usuário e por perfil.
   - Conferir entitlements.
   - Conferir admin grant Pro manual.
   - Conferir que billing checkout/portal retornam erro controlado enquanto não há gateway.
   - Confirmar ausência de sync temporário.

## Bugs Atuais Que A Reorganização Deve Resolver

- `npm run dev` sobe Express em `3001`, mas Vite envia `/api` para FastAPI em `8000`.
- Existem três caminhos de API concorrentes: Express monolítico, Vercel functions e FastAPI.
- FastAPI não implementa `PUT/DELETE /api/topics`, mas frontend chama essas rotas.
- Billing existe no Node, mas não no FastAPI.
- `order`, `orderNum` e `order_num` estão inconsistentes.
- Settings local exige `id`, mas schema remoto usa `user_id`.
- `backend/` e `Backend/` coexistem e confundem casing.
- Há instrumentação/debug hardcoded em `api/server.ts`.
- Testes falham por falta de `jsdom`.
- Build falha por erros TypeScript de tipos/timestamps/imports não usados.

## Cuidados

- Não commitar `.env`, bancos SQLite locais, `.venv`, `node_modules`, caches ou dados pessoais.
- Não remover mudanças não commitadas sem confirmação explícita.
- Não criar branch como solução para código privado, pois branch pública não resolve privacidade.
- Não implementar sync nesta etapa.
- Não escolher gateway de pagamento nesta etapa.
- Não manter código de auth/billing no projeto open-source.
- Evitar duas fontes de verdade no frontend: IndexedDB deve sair do papel de banco principal.

## Fora De Escopo Nesta Etapa

- Sync cloud.
- Apps desktop/mobile.
- Integração real com gateway de pagamento.
- Publicação/deploy final.
- Criação de repositório remoto privado no GitHub.
- Commits/pushes automáticos.
