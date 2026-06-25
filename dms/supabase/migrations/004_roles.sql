-- =========================================================
-- DMS Fase 3.3 - Papéis formais (Verificador / Aprovador / Cliente Externo)
-- e RLS granular.
--
-- IMPORTANTE: esta migration é ADITIVA. Ninguém que já tem acesso hoje
-- (admin, member) perde acesso. Só o novo papel "cliente_externo" passa
-- a ter visibilidade restrita (só aos projetos liberados para ele, e só
-- a documentos já emitidos).
-- Cole no SQL Editor depois do 001, 002 e 003.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Novos papéis em profiles.role
-- ---------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'member', 'verificador', 'aprovador', 'cliente_externo'));

-- ---------------------------------------------------------
-- 2) Função auxiliar: papel do usuário atual
-- ---------------------------------------------------------
create or replace function public.current_role_name()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_cliente_externo()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select public.current_role_name() = 'cliente_externo';
$$;

-- ---------------------------------------------------------
-- 3) project_client_access (quais projetos um cliente externo pode ver)
-- ---------------------------------------------------------
create table if not exists public.project_client_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_user_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (project_id, client_user_id)
);

alter table public.project_client_access enable row level security;

create policy "project_client_access_select" on public.project_client_access
  for select to authenticated using (public.is_admin() or client_user_id = auth.uid());
create policy "project_client_access_admin_write" on public.project_client_access
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.project_client_access
    where project_id = p_project_id and client_user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------
-- 4) Restringir visibilidade para cliente_externo
--    (regra: se você NÃO é cliente_externo, nada muda. Se você É,
--     só vê projetos liberados, e só documentos/revisões emitidos.)
-- ---------------------------------------------------------

drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects
  for select to authenticated using (
    not public.is_cliente_externo() or public.has_project_access(id)
  );

drop policy if exists "project_documents_select" on public.project_documents;
create policy "project_documents_select" on public.project_documents
  for select to authenticated using (
    not public.is_cliente_externo()
    or (public.has_project_access(project_id) and status = 'emitido')
  );

drop policy if exists "document_revisions_select" on public.document_revisions;
create policy "document_revisions_select" on public.document_revisions
  for select to authenticated using (
    not public.is_cliente_externo()
    or (
      status = 'emitido'
      and exists (
        select 1 from public.project_documents pd
        where pd.id = document_revisions.project_document_id
          and public.has_project_access(pd.project_id)
      )
    )
  );

-- cliente externo não participa de comentários internos, fluxo de aprovação ou checklists
drop policy if exists "revision_comments_select" on public.revision_comments;
create policy "revision_comments_select" on public.revision_comments
  for select to authenticated using (not public.is_cliente_externo());

drop policy if exists "approval_steps_select" on public.revision_approval_steps;
create policy "approval_steps_select" on public.revision_approval_steps
  for select to authenticated using (not public.is_cliente_externo());

drop policy if exists "checklist_responses_select" on public.checklist_responses;
create policy "checklist_responses_select" on public.checklist_responses
  for select to authenticated using (not public.is_cliente_externo());

-- cliente externo nunca escreve nada (somente leitura do que for liberado)
drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects
  for insert to authenticated with check (not public.is_cliente_externo());

drop policy if exists "project_documents_insert" on public.project_documents;
create policy "project_documents_insert" on public.project_documents
  for insert to authenticated with check (not public.is_cliente_externo());

drop policy if exists "project_documents_update" on public.project_documents;
create policy "project_documents_update" on public.project_documents
  for update to authenticated using (not public.is_cliente_externo());

drop policy if exists "document_revisions_insert" on public.document_revisions;
create policy "document_revisions_insert" on public.document_revisions
  for insert to authenticated with check (not public.is_cliente_externo());

-- ---------------------------------------------------------
-- 5) Verificador também pode administrar checklists (configuração de auditoria)
-- ---------------------------------------------------------
drop policy if exists "checklist_templates_admin_write" on public.checklist_templates;
create policy "checklist_templates_admin_write" on public.checklist_templates
  for all to authenticated
  using (public.is_admin() or public.current_role_name() = 'verificador')
  with check (public.is_admin() or public.current_role_name() = 'verificador');

drop policy if exists "checklist_items_admin_write" on public.checklist_template_items;
create policy "checklist_items_admin_write" on public.checklist_template_items
  for all to authenticated
  using (public.is_admin() or public.current_role_name() = 'verificador')
  with check (public.is_admin() or public.current_role_name() = 'verificador');

-- =========================================================
-- Fim da migration 004
-- =========================================================
