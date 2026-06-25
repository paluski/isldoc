-- =========================================================
-- DMS Fase 3.9 - Estado de finalização formal
-- Cole no SQL Editor depois de 001 a 007.
-- =========================================================

alter table public.document_revisions drop constraint if exists document_revisions_status_check;
alter table public.document_revisions
  add constraint document_revisions_status_check
  check (status in ('rascunho', 'em_analise', 'aprovado', 'reprovado', 'emitido', 'finalizado'));

alter table public.document_revisions
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by uuid references public.profiles(id);

-- =========================================================
-- Fim da migration 008
-- =========================================================
