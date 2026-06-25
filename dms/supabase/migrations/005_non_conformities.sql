-- =========================================================
-- DMS Fase 3.4 - Não Conformidades
-- Cole no SQL Editor depois de 001 a 004.
-- =========================================================

create table if not exists public.non_conformities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_revision_id uuid references public.document_revisions(id) on delete set null,
  checklist_response_item_id uuid references public.checklist_response_items(id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'media' check (severity in ('baixa', 'media', 'alta', 'critica')),
  status text not null default 'aberta' check (status in ('aberta', 'em_tratativa', 'encerrada')),
  responsible_user_id uuid references public.profiles(id),
  due_date date,
  opened_by uuid references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references public.profiles(id),
  closing_notes text
);

create table if not exists public.non_conformity_actions (
  id uuid primary key default gen_random_uuid(),
  non_conformity_id uuid not null references public.non_conformities(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action_text text not null,
  created_at timestamptz not null default now()
);

alter table public.non_conformities enable row level security;
alter table public.non_conformity_actions enable row level security;

-- visível pra qualquer autenticado interno (cliente externo não vê NC, igual ao resto do fluxo interno)
create policy "non_conformities_select" on public.non_conformities
  for select to authenticated using (not public.is_cliente_externo());
create policy "non_conformities_insert" on public.non_conformities
  for insert to authenticated with check (not public.is_cliente_externo());
create policy "non_conformities_update" on public.non_conformities
  for update to authenticated using (not public.is_cliente_externo());

create policy "non_conformity_actions_select" on public.non_conformity_actions
  for select to authenticated using (not public.is_cliente_externo());
create policy "non_conformity_actions_insert" on public.non_conformity_actions
  for insert to authenticated with check (not public.is_cliente_externo());

-- =========================================================
-- Fim da migration 005
-- =========================================================
