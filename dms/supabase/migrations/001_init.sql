-- =========================================================
-- DMS Fase 1 - schema inicial
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- =========================================================

-- ---------------------------------------------------------
-- 1) profiles (perfil + papel do usuário)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- cria automaticamente um profile quando um usuário se cadastra no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'member');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- função auxiliar usada nas policies abaixo
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- 2) document_types (catálogo reutilizável de tipos de documento)
-- ---------------------------------------------------------
create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_subfolder_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.document_types (name, default_subfolder_name, description)
select * from (values
  ('Anexo 1 - Requerimento de Cadastramento', 'Anexo1_Requerimento', 'Conforme modelo do Anexo III (em meio digital).'),
  ('Anexo 2 - Memorial Descritivo', 'Anexo2_Memorial', 'Memorial Descritivo do Projeto.'),
  ('Anexo 3 - Licença', 'Anexo3_Licenca', 'Protocolo da Licença / Licença Ambiental.'),
  ('Anexo 4 - Documentos de Acesso e Contratos', 'Anexo4_DocumentosDeAcessoEContratos', 'Documentos de Acesso e Contratos de Uso da Rede.'),
  ('Anexo 5 - Ficha de Dados', 'Anexo5_Ficha', 'Ficha de Dados final exportada do Sistema AEGE.'),
  ('Anexo 6 - Direito de Uso', 'Anexo6_DireitoUso', 'Direito de Usar ou Dispor do Local.'),
  ('Anexo 7 - Declaração', 'Anexo7_Declaracao', 'Declaração de Participação de Empreendimentos com Conteúdo Nacional.'),
  ('Anexo 8 - Estudos Ambientais', 'Anexo8_EstudosAmbientais', 'Estudos e Relatórios de Impacto Ambiental.')
) as seed(name, default_subfolder_name, description)
where not exists (select 1 from public.document_types);

-- ---------------------------------------------------------
-- 3) projects
-- ---------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  municipio text,
  estado text,
  endereco text,
  area numeric,
  potencia_instalada numeric,
  status text not null default 'ativo',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4) project_documents (vínculo projeto <-> tipo de documento)
-- ---------------------------------------------------------
create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id),
  nome_padrao_arquivo text not null,
  responsible_user_id uuid references public.profiles(id),
  status text not null default 'pendente',
  current_revision_id uuid,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5) document_revisions (histórico imutável de arquivos)
-- ---------------------------------------------------------
create table if not exists public.document_revisions (
  id uuid primary key default gen_random_uuid(),
  project_document_id uuid not null references public.project_documents(id) on delete cascade,
  revision_code text not null,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  is_emission boolean not null default false,
  status text not null default 'rascunho' check (status in ('rascunho', 'em_analise', 'aprovado', 'reprovado')),
  notes text
);

alter table public.project_documents
  add constraint project_documents_current_revision_fk
  foreign key (current_revision_id) references public.document_revisions(id)
  on delete set null;

-- ---------------------------------------------------------
-- 6) revision_comments
-- ---------------------------------------------------------
create table if not exists public.revision_comments (
  id uuid primary key default gen_random_uuid(),
  document_revision_id uuid not null references public.document_revisions(id) on delete cascade,
  user_id uuid references public.profiles(id),
  comment text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 7) revision_numbering_settings (regra de numeração configurável)
-- ---------------------------------------------------------
create table if not exists public.revision_numbering_settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  pre_emission_increment text not null default 'letter' check (pre_emission_increment in ('letter', 'number')),
  post_emission_increment text not null default 'number' check (post_emission_increment in ('letter', 'number')),
  initial_number int not null default 0,
  initial_letter text not null default 'A',
  created_at timestamptz not null default now()
);

insert into public.revision_numbering_settings (scope)
select 'global'
where not exists (select 1 from public.revision_numbering_settings where scope = 'global');

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.document_types enable row level security;
alter table public.projects enable row level security;
alter table public.project_documents enable row level security;
alter table public.document_revisions enable row level security;
alter table public.revision_comments enable row level security;
alter table public.revision_numbering_settings enable row level security;

-- profiles: todo autenticado pode ler (necessário para listas de responsáveis);
-- cada um só atualiza o próprio nome; só admin muda role de qualquer um.
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own_name" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "profiles_admin_manage" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- document_types: leitura para todos autenticados; escrita só admin
create policy "document_types_select" on public.document_types
  for select to authenticated using (true);
create policy "document_types_admin_write" on public.document_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects: leitura/criação para autenticados; update/delete: criador ou admin
create policy "projects_select" on public.projects
  for select to authenticated using (true);
create policy "projects_insert" on public.projects
  for insert to authenticated with check (true);
create policy "projects_update_owner_or_admin" on public.projects
  for update to authenticated using (created_by = auth.uid() or public.is_admin());
create policy "projects_delete_admin" on public.projects
  for delete to authenticated using (public.is_admin());

-- project_documents: leitura/criação/atualização para autenticados; delete só admin
create policy "project_documents_select" on public.project_documents
  for select to authenticated using (true);
create policy "project_documents_insert" on public.project_documents
  for insert to authenticated with check (true);
create policy "project_documents_update" on public.project_documents
  for update to authenticated using (true);
create policy "project_documents_delete_admin" on public.project_documents
  for delete to authenticated using (public.is_admin());

-- document_revisions: histórico imutável - leitura/criação para autenticados, sem update/delete (exceto admin)
create policy "document_revisions_select" on public.document_revisions
  for select to authenticated using (true);
create policy "document_revisions_insert" on public.document_revisions
  for insert to authenticated with check (true);
create policy "document_revisions_admin_modify" on public.document_revisions
  for update to authenticated using (public.is_admin());
create policy "document_revisions_admin_delete" on public.document_revisions
  for delete to authenticated using (public.is_admin());

-- revision_comments: leitura/criação para autenticados
create policy "revision_comments_select" on public.revision_comments
  for select to authenticated using (true);
create policy "revision_comments_insert" on public.revision_comments
  for insert to authenticated with check (true);

-- revision_numbering_settings: leitura para autenticados; escrita só admin
create policy "revision_settings_select" on public.revision_numbering_settings
  for select to authenticated using (true);
create policy "revision_settings_admin_write" on public.revision_numbering_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- Storage: bucket "documents"
-- =========================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_storage_select" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
create policy "documents_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
create policy "documents_storage_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and public.is_admin());

-- =========================================================
-- Fim da migration 001
-- =========================================================
