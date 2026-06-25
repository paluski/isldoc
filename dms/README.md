# Gestão de Documentos (DMS) — Fases 1, 2 e 3

Sistema de gestão de documentos de projeto: login, projetos, documentos, revisões com histórico completo, fluxo de aprovação configurável (estilo e-Clic), checklists de auditoria, não conformidades, dashboard, matriz de aplicabilidade, log de auditoria e relatórios/databook. Banco e armazenamento no Supabase.

> Este app é **separado** do gerador de Memorial Descritivo (`../server.js`, `../pdf-generator.js`, `../public`). Os dois não se sobrepõem e podem rodar ao mesmo tempo, em portas diferentes.

## 1. Configurar o Supabase

1. Abra o seu projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor**, cole e execute, **nesta ordem exata**:
   - [`001_init.sql`](supabase/migrations/001_init.sql) — tabelas base, RLS, bucket `documents`, catálogo de tipos de documento (Anexo 1–8).
   - [`002_workflows.sql`](supabase/migrations/002_workflows.sql) — fluxos de aprovação, hierarquias, conjuntos de documentos.
   - [`003_checklists.sql`](supabase/migrations/003_checklists.sql) — checklists de auditoria.
   - [`004_roles.sql`](supabase/migrations/004_roles.sql) — papéis (Verificador, Aprovador, Cliente Externo) + RLS granular. **Aditivo**: não remove acesso de quem já usa o sistema.
   - [`005_non_conformities.sql`](supabase/migrations/005_non_conformities.sql) — não conformidades.
   - [`006_project_code_client.sql`](supabase/migrations/006_project_code_client.sql) — código único do projeto + cliente.
   - [`007_audit_log.sql`](supabase/migrations/007_audit_log.sql) — log de auditoria genérico (triggers automáticos).
   - [`008_finalization.sql`](supabase/migrations/008_finalization.sql) — estado de finalização formal.
3. Se o bucket `documents` não tiver sido criado pelo `001_init.sql` (alguns projetos não permitem `insert into storage.buckets` via SQL Editor): vá em **Storage → New bucket**, crie um bucket chamado `documents`, marcado como **privado**, com **Mount Path**/nome exatamente `documents`. Depois disso, rode de novo só os 3 `create policy ... on storage.objects` do final do `001_init.sql`.
4. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.
5. Edite o arquivo `.env` na raiz do `dms/` (ou copie de `.env.example`) e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_MEMORIAL_GENERATOR_URL=http://localhost:3000
```

> A chave **anon** é segura para usar no front-end (é a mesma que o RLS protege). Nunca coloque a **service role key** aqui.

## 2. Rodar localmente

```bash
cd dms
npm install
npm run dev
```

## 3. Primeiro acesso

1. Na tela de login, vá na aba **Criar conta** e cadastre seu usuário.
2. Todo usuário novo entra como **member**. Para virar **admin**, vá no Supabase em **Table Editor → profiles**, ache sua linha e mude `role` para `admin`. A partir daí, qualquer admin promove outros pela tela **Admin → Usuários**.

## 4. Como montar um fluxo do zero

1. **Admin → Hierarquias**: crie os níveis genéricos que vão existir nos seus fluxos (ex: "Elaborador", "Verificador", "Aprovador").
2. **Admin → Fluxos de Aprovação**: crie as etapas, em ordem. Cada etapa aponta para um nível de hierarquia (pelo nome) ou para um usuário específico fixo.
3. **Admin → Checklists de Auditoria** (opcional): crie os itens que serão verificados (Conforme/Não Conforme/N.A.) em cada auditoria documental.
4. **Admin → Conjuntos de Documentos** (opcional): defina quais tipos de documento são exigidos para um tipo de projeto.
5. **Novo Projeto**: informe código e cliente, vincule o fluxo, a hierarquia e o conjunto de documentos criados.
6. Dentro do projeto, em **Configurações do Projeto**: atribua pessoas reais a cada nível da hierarquia, clique em **Aplicar Conjunto** para criar os documentos exigidos, e (se for o caso) libere acesso de **clientes externos** a este projeto.
7. Em cada documento: **Enviar Nova Revisão** (rascunho) → **Enviar para Aprovação** → cada aprovador decide na sua vez (no card do documento ou em **Minhas Aprovações**) → **Emitir Documento** (recalcula a numeração) → **Finalizar Documento** (encerra formalmente o ciclo daquela revisão).
8. Acompanhe pendências automaticamente na **Matriz de Aplicabilidade** (dentro do projeto) e nos indicadores do **Dashboard**.
9. Registre **Checklists** e **Não Conformidades** a qualquer momento, pelo painel do projeto.

Se um projeto não tiver fluxo vinculado, o botão **Emitir Documento** fica disponível direto a partir do rascunho — útil para destravar o uso enquanto os fluxos não estão todos configurados.

## 5. Papéis de usuário

| Papel | Acesso |
|---|---|
| `admin` | Tudo, incluindo telas de Administração e Log de Auditoria |
| `member` | Uso normal do sistema (projetos, documentos, aprovações conforme atribuído) |
| `verificador` | Como `member`, mais administração de Checklists de Auditoria |
| `aprovador` | Como `member` — usado para identificar quem normalmente assume etapas de aprovação |
| `cliente_externo` | **Somente leitura**, e só dos projetos liberados em "Configurações do Projeto → Acesso de clientes externos", e só de documentos com status `emitido`. Não vê comentários, fluxo de aprovação ou checklists internos. |

## 6. O que já existe

**Fase 1** — login/papéis, projetos, documentos vinculados a catálogo de tipos, revisões com numeração automática configurável, histórico completo, comentários.

**Fase 2** — Fluxos de Aprovação, Hierarquias e Conjuntos de Documentos configuráveis; execução do fluxo por revisão; página Minhas Aprovações.

**Fase 3**:
- **Dashboard**: KPIs (projetos ativos, documentos pendentes, aprovações pendentes, revisões reprovadas, não conformidades abertas), taxa de conformidade, indicadores por responsável e por cliente.
- **Checklist de Auditoria**: templates configuráveis, execução com Conforme/Não Conforme/N.A. + observações, % de atendimento automático, histórico por projeto.
- **Papéis formais + RLS granular**: Verificador, Aprovador, Cliente Externo com visibilidade restrita real no banco (RLS), aditivo.
- **Não Conformidades**: registro com severidade, responsável, prazo, histórico de tratativas, encerramento formal.
- **Código único + Cliente** no cadastro de projeto, com indicador por cliente no dashboard.
- **Matriz de Aplicabilidade**: cálculo automático de pendências (documentos faltando vincular ou ainda não emitidos) comparado ao conjunto de documentos exigido.
- **Log de Auditoria genérico**: triggers no banco registrando old/new de toda alteração em projetos, documentos, revisões, perfis e não conformidades — consulta em **Admin → Log de Auditoria**.
- **Relatórios**: índice do databook em PDF, exportação para Excel, e download do databook completo em ZIP (revisões emitidas + índice).
- **Estado de Finalização**: ciclo formal `emitido → finalizado`, distinto e posterior à emissão.

## Estrutura

```
src/
  lib/supabaseClient.js        cliente Supabase
  lib/revisionRules.js         lógica pura de numeração de revisão
  lib/workflowEngine.js        instanciar etapas, aprovar/reprovar, emitir, finalizar
  lib/applicability.js         cálculo puro de pendências (matriz de aplicabilidade)
  lib/reports.js               geração de PDF/Excel/ZIP (databook)
  lib/roles.js                 labels dos papéis de usuário
  auth/                        contexto de autenticação, rota protegida, tela de login
  pages/                       Dashboard, Projetos, Detalhe do Projeto, Minhas Aprovações, telas de Admin
  components/                  cartão de documento, etapas de aprovação, checklist, não conformidades,
                                matriz de aplicabilidade, relatórios, histórico, upload, comentários, config do projeto
supabase/migrations/           SQL para colar no Supabase, em ordem (001 → 008)
```
