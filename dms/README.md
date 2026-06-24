# Gestão de Documentos (DMS) — Fase 1 + Fase 2

Sistema de gestão de documentos de projeto: login, projetos, documentos, revisões com histórico completo, comentários, e fluxo de aprovação configurável (estilo e-Clic) com hierarquia de aprovadores. Banco e armazenamento no Supabase.

> Este app é **separado** do gerador de Memorial Descritivo (`../server.js`, `../pdf-generator.js`, `../public`). Os dois não se sobrepõem e podem rodar ao mesmo tempo, em portas diferentes.

## 1. Configurar o Supabase

1. Abra o seu projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor**, cole e execute, **nesta ordem**:
   - [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) — tabelas base, RLS, bucket `documents`, catálogo de tipos de documento (Anexo 1–8).
   - [`supabase/migrations/002_workflows.sql`](supabase/migrations/002_workflows.sql) — fluxos de aprovação, hierarquias, conjuntos de documentos.
3. Se o bucket `documents` não tiver sido criado pelo `001_init.sql` (alguns projetos não permitem `insert into storage.buckets` via SQL Editor): vá em **Storage → New bucket**, crie um bucket chamado `documents`, marcado como **privado**. Depois disso, rode de novo só os 3 `create policy ... on storage.objects` que estão no final do `001_init.sql`.
4. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.
5. Edite o arquivo `.env` na raiz do `dms/` (ou copie de `.env.example`) e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
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
2. **Admin → Fluxos de Aprovação**: crie as etapas, em ordem. Cada etapa aponta para um nível de hierarquia (pelo nome, ex: "Verificador") ou para um usuário específico fixo.
3. **Admin → Conjuntos de Documentos** (opcional): defina quais tipos de documento são exigidos para um tipo de projeto.
4. **Novo Projeto**: vincule o fluxo, a hierarquia e o conjunto de documentos criados.
5. Dentro do projeto, em **Configurações do Projeto**, atribua pessoas reais a cada nível da hierarquia (ex: quem é o "Verificador" *deste* projeto) e clique em **Aplicar Conjunto** para criar automaticamente os documentos exigidos.
6. Em cada documento: **Enviar Nova Revisão** (fica como rascunho) → **Enviar para Aprovação** (instancia as etapas do fluxo, resolvendo quem é o aprovador de cada uma a partir da hierarquia do projeto) → cada aprovador decide na sua vez (no card do documento ou em **Minhas Aprovações**) → quando todas as etapas são aprovadas, aparece o botão **Emitir Documento**, que recalcula o código de revisão pela regra configurada em **Admin → Numeração de Revisão**.

Se um projeto não tiver fluxo vinculado, o botão **Emitir Documento** fica disponível direto a partir do rascunho (sem etapas de aprovação) — útil para destravar o uso enquanto os fluxos não estão todos configurados.

## 5. O que já existe

**Fase 1:**
- Login / criação de conta (Supabase Auth) e papéis (admin/membro).
- Projetos, documentos vinculados a um catálogo de tipos, responsável por documento.
- Revisões com numeração automática configurável (`0A → 0B → ... → 1A → 2A ...`), histórico completo (nada é apagado), download de qualquer revisão anterior com nome `nome_padrao_arquivo_REV.ext`, comentários por revisão.

**Fase 2:**
- **Fluxos de Aprovação** configuráveis (etapas ordenadas, cada uma com aprovador por nível de hierarquia ou usuário fixo).
- **Hierarquias** configuráveis (níveis nomeados, reutilizáveis entre projetos).
- **Conjuntos de Documentos** (lista de tipos de documento exigidos, aplicável a um projeto com um clique).
- Vínculo de fluxo/hierarquia/conjunto a cada projeto, com atribuição de pessoas reais por nível **dentro do projeto**.
- Execução do fluxo por revisão: enviar para aprovação, aprovar/reprovar com comentário (sequencial, respeitando a ordem das etapas), emissão final que recalcula a numeração.
- Página **Minhas Aprovações**: lista, para o usuário logado, todas as etapas pendentes em qualquer projeto.

## Estrutura

```
src/
  lib/supabaseClient.js        cliente Supabase
  lib/revisionRules.js         lógica pura de numeração de revisão
  lib/workflowEngine.js        instanciar etapas, aprovar/reprovar, emitir
  auth/                        contexto de autenticação, rota protegida, tela de login
  pages/                       Projetos, Detalhe do Projeto, Minhas Aprovações, telas de Admin
  components/                  cartão de documento, etapas de aprovação, histórico, upload, comentários, config do projeto
supabase/migrations/           SQL para colar no Supabase (rodar em ordem: 001, depois 002)
```
