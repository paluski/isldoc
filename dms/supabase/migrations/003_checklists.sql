-- =========================================================
-- DMS Fase 3.2 - Checklist de Auditoria
-- Cole no SQL Editor do Supabase depois do 001 e 002.
-- =========================================================

-- ---------------------------------------------------------
-- 1) checklist_templates / checklist_template_items
-- ---------------------------------------------------------
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  checklist_template_id uuid not null references public.checklist_templates(id) on delete cascade,
  item_order int not null,
  description text not null,
  is_required boolean not null default true
);

-- ---------------------------------------------------------
-- 2) checklist_responses (uma "execução" do checklist)
--    vinculada a um projeto e, opcionalmente, a uma revisão específica
-- ---------------------------------------------------------
create table if not exists public.checklist_responses (
  id uuid primary key default gen_random_uuid(),
  checklist_template_id uuid not null references public.checklist_templates(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_revision_id uuid references public.document_revisions(id) on delete cascade,
  performed_by uuid references public.profiles(id),
  performed_at timestamptz not null default now(),
  notes text
);

create table if not exists public.checklist_response_items (
  id uuid primary key default gen_random_uuid(),
  checklist_response_id uuid not null references public.checklist_responses(id) on delete cascade,
  checklist_template_item_id uuid not null references public.checklist_template_items(id),
  result text not null check (result in ('conforme', 'nao_conforme', 'nao_aplicavel')),
  observacao text
);

-- =========================================================
-- RLS
-- =========================================================
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.checklist_responses enable row level security;
alter table public.checklist_response_items enable row level security;

create policy "checklist_templates_select" on public.checklist_templates for select to authenticated using (true);
create policy "checklist_templates_admin_write" on public.checklist_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "checklist_items_select" on public.checklist_template_items for select to authenticated using (true);
create policy "checklist_items_admin_write" on public.checklist_template_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- respostas de checklist: qualquer autenticado pode registrar (é quem está auditando), leitura geral,
-- sem update/delete (histórico de auditoria imutável, igual às revisões de documento)
create policy "checklist_responses_select" on public.checklist_responses for select to authenticated using (true);
create policy "checklist_responses_insert" on public.checklist_responses for insert to authenticated with check (true);

create policy "checklist_response_items_select" on public.checklist_response_items for select to authenticated using (true);
create policy "checklist_response_items_insert" on public.checklist_response_items for insert to authenticated with check (true);

-- =========================================================
-- Fim da migration 003
-- =========================================================
