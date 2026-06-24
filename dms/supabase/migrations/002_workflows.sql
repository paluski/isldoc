-- =========================================================
-- DMS Fase 2 - fluxo de aprovação configurável, hierarquia, conjuntos de documentos
-- Cole este arquivo no SQL Editor do Supabase (depois de já ter rodado o 001_init.sql).
-- =========================================================

-- ---------------------------------------------------------
-- 1) hierarchy_templates / hierarchy_template_levels
-- ---------------------------------------------------------
create table if not exists public.hierarchy_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.hierarchy_template_levels (
  id uuid primary key default gen_random_uuid(),
  hierarchy_template_id uuid not null references public.hierarchy_templates(id) on delete cascade,
  level_order int not null,
  name text not null
);

-- ---------------------------------------------------------
-- 2) workflow_templates / workflow_template_steps
-- ---------------------------------------------------------
create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_template_id uuid not null references public.workflow_templates(id) on delete cascade,
  step_order int not null,
  name text not null,
  approver_type text not null check (approver_type in ('hierarchy_level', 'specific_user')),
  approver_level_name text,
  specific_user_id uuid references public.profiles(id),
  constraint workflow_step_approver_consistency check (
    (approver_type = 'hierarchy_level' and approver_level_name is not null and specific_user_id is null)
    or
    (approver_type = 'specific_user' and specific_user_id is not null and approver_level_name is null)
  )
);

-- ---------------------------------------------------------
-- 3) document_set_templates / document_set_template_items
-- ---------------------------------------------------------
create table if not exists public.document_set_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.document_set_template_items (
  id uuid primary key default gen_random_uuid(),
  document_set_template_id uuid not null references public.document_set_templates(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id),
  nome_padrao_sugerido text
);

-- ---------------------------------------------------------
-- 4) projects: vincular fluxo / hierarquia / conjunto de documentos
-- ---------------------------------------------------------
alter table public.projects
  add column if not exists workflow_template_id uuid references public.workflow_templates(id),
  add column if not exists hierarchy_template_id uuid references public.hierarchy_templates(id),
  add column if not exists document_set_template_id uuid references public.document_set_templates(id);

-- ---------------------------------------------------------
-- 5) project_hierarchy_assignments (pessoas reais por nível, por projeto)
-- ---------------------------------------------------------
create table if not exists public.project_hierarchy_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  hierarchy_template_level_id uuid not null references public.hierarchy_template_levels(id) on delete cascade,
  user_id uuid references public.profiles(id),
  unique (project_id, hierarchy_template_level_id)
);

-- ---------------------------------------------------------
-- 6) revision_approval_steps (instância real do fluxo, por revisão)
-- ---------------------------------------------------------
create table if not exists public.revision_approval_steps (
  id uuid primary key default gen_random_uuid(),
  document_revision_id uuid not null references public.document_revisions(id) on delete cascade,
  step_order int not null,
  name text not null,
  approver_user_id uuid references public.profiles(id),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  decided_at timestamptz,
  comment text,
  created_at timestamptz not null default now()
);

-- document_revisions.status agora também aceita 'emitido'
alter table public.document_revisions drop constraint if exists document_revisions_status_check;
alter table public.document_revisions
  add constraint document_revisions_status_check
  check (status in ('rascunho', 'em_analise', 'aprovado', 'reprovado', 'emitido'));

-- =========================================================
-- RLS
-- =========================================================
alter table public.hierarchy_templates enable row level security;
alter table public.hierarchy_template_levels enable row level security;
alter table public.workflow_templates enable row level security;
alter table public.workflow_template_steps enable row level security;
alter table public.document_set_templates enable row level security;
alter table public.document_set_template_items enable row level security;
alter table public.project_hierarchy_assignments enable row level security;
alter table public.revision_approval_steps enable row level security;

-- templates de fluxo/hierarquia/conjunto: leitura geral, escrita só admin
create policy "hierarchy_templates_select" on public.hierarchy_templates for select to authenticated using (true);
create policy "hierarchy_templates_admin_write" on public.hierarchy_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "hierarchy_levels_select" on public.hierarchy_template_levels for select to authenticated using (true);
create policy "hierarchy_levels_admin_write" on public.hierarchy_template_levels for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "workflow_templates_select" on public.workflow_templates for select to authenticated using (true);
create policy "workflow_templates_admin_write" on public.workflow_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "workflow_steps_select" on public.workflow_template_steps for select to authenticated using (true);
create policy "workflow_steps_admin_write" on public.workflow_template_steps for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "document_set_templates_select" on public.document_set_templates for select to authenticated using (true);
create policy "document_set_templates_admin_write" on public.document_set_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "document_set_items_select" on public.document_set_template_items for select to authenticated using (true);
create policy "document_set_items_admin_write" on public.document_set_template_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- atribuição de pessoas por nível, por projeto: leitura/escrita para autenticados (qualquer membro do projeto pode ajustar)
create policy "project_hierarchy_assignments_select" on public.project_hierarchy_assignments for select to authenticated using (true);
create policy "project_hierarchy_assignments_write" on public.project_hierarchy_assignments for all to authenticated using (true) with check (true);

-- etapas de aprovação: leitura geral; criação por qualquer autenticado (quem sobe o documento dispara o fluxo);
-- decisão (update) só por quem é o aprovador da etapa ou admin
create policy "approval_steps_select" on public.revision_approval_steps for select to authenticated using (true);
create policy "approval_steps_insert" on public.revision_approval_steps for insert to authenticated with check (true);
create policy "approval_steps_decide" on public.revision_approval_steps for update to authenticated
  using (approver_user_id = auth.uid() or public.is_admin());

-- =========================================================
-- Fim da migration 002
-- =========================================================
