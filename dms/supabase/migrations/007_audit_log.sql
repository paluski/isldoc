-- =========================================================
-- DMS Fase 3.7 - Log de auditoria genérico
-- Cole no SQL Editor depois de 001 a 006.
-- =========================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index if not exists audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index if not exists audit_log_changed_at_idx on public.audit_log (changed_at desc);

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce((case when TG_OP = 'DELETE' then old.id else new.id end), null),
    lower(TG_OP),
    auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_projects on public.projects;
create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute function public.log_audit();

drop trigger if exists audit_project_documents on public.project_documents;
create trigger audit_project_documents
  after insert or update or delete on public.project_documents
  for each row execute function public.log_audit();

drop trigger if exists audit_document_revisions on public.document_revisions;
create trigger audit_document_revisions
  after insert or update or delete on public.document_revisions
  for each row execute function public.log_audit();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after update on public.profiles
  for each row execute function public.log_audit();

drop trigger if exists audit_non_conformities on public.non_conformities;
create trigger audit_non_conformities
  after insert or update or delete on public.non_conformities
  for each row execute function public.log_audit();

-- =========================================================
-- RLS: só admin consulta o log de auditoria
-- =========================================================
alter table public.audit_log enable row level security;

create policy "audit_log_admin_select" on public.audit_log
  for select to authenticated using (public.is_admin());

-- =========================================================
-- Fim da migration 007
-- =========================================================
