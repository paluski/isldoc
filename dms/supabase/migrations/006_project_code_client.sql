-- =========================================================
-- DMS Fase 3.5 - Código único do projeto + Cliente
-- Cole no SQL Editor depois de 001 a 005.
-- =========================================================

alter table public.projects
  add column if not exists project_code text,
  add column if not exists client_name text;

-- código único (permite nulo para projetos já existentes sem código, mas não duplicado quando preenchido)
create unique index if not exists projects_project_code_unique
  on public.projects (project_code)
  where project_code is not null;

-- =========================================================
-- Fim da migration 006
-- =========================================================
