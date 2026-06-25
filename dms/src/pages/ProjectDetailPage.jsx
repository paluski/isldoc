import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Title,
  Text,
  Stack,
  Group,
  Button,
  Loader,
  Center,
  Modal,
  Select,
  TextInput,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { DocumentCard } from '../components/DocumentCard';
import { ProjectConfigPanel } from '../components/ProjectConfigPanel';
import { ChecklistPanel } from '../components/ChecklistPanel';
import { NonConformitiesPanel } from '../components/NonConformitiesPanel';
import { ApplicabilityPanel } from '../components/ApplicabilityPanel';
import { ReportsPanel } from '../components/ReportsPanel';

export function ProjectDetailPage() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ document_type_id: '', nome_padrao_arquivo: '', responsible_user_id: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const [{ data: projectData, error: projectError }, { data: typesData }, { data: profilesData }, { data: settingsData }] =
      await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('document_types').select('*').eq('is_active', true).order('name'),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('revision_numbering_settings').select('*').eq('scope', 'global').single()
      ]);

    if (projectError) {
      notifications.show({ color: 'red', message: `Erro ao carregar projeto: ${projectError.message}` });
      setLoading(false);
      return;
    }

    setProject(projectData);
    setDocumentTypes(typesData ?? []);
    setProfiles(profilesData ?? []);
    setSettings(settingsData ?? null);

    const { data: docsData, error: docsError } = await supabase
      .from('project_documents')
      .select('*, document_types(name, default_subfolder_name)')
      .eq('project_id', projectId)
      .order('created_at');

    if (docsError) {
      notifications.show({ color: 'red', message: `Erro ao carregar documentos: ${docsError.message}` });
      setLoading(false);
      return;
    }

    const docIds = (docsData ?? []).map((d) => d.id);
    let revisionsByDoc = {};
    if (docIds.length > 0) {
      const { data: revisionsData, error: revisionsError } = await supabase
        .from('document_revisions')
        .select('*, profiles(full_name)')
        .in('project_document_id', docIds)
        .order('uploaded_at', { ascending: false });

      if (revisionsError) {
        notifications.show({ color: 'red', message: `Erro ao carregar revisões: ${revisionsError.message}` });
      } else {
        revisionsByDoc = revisionsData.reduce((acc, rev) => {
          (acc[rev.project_document_id] ||= []).push(rev);
          return acc;
        }, {});
      }
    }

    setDocuments((docsData ?? []).map((d) => ({ ...d, revisions: revisionsByDoc[d.id] ?? [] })));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleLinkDocument(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('project_documents').insert({
      project_id: projectId,
      document_type_id: linkForm.document_type_id,
      nome_padrao_arquivo: linkForm.nome_padrao_arquivo,
      responsible_user_id: linkForm.responsible_user_id || null
    });
    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao vincular documento: ${error.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Documento vinculado ao projeto!' });
    setLinkModalOpen(false);
    setLinkForm({ document_type_id: '', nome_padrao_arquivo: '', responsible_user_id: '' });
    loadAll();
  }

  function handleTypeSelected(typeId) {
    const type = documentTypes.find((t) => t.id === typeId);
    setLinkForm((f) => ({
      ...f,
      document_type_id: typeId,
      nome_padrao_arquivo: f.nome_padrao_arquivo || (type ? `${project?.name}_${type.default_subfolder_name}` : '')
    }));
  }

  if (loading || !project) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Breadcrumbs>
        <Anchor component={Link} to="/projects">
          Projetos
        </Anchor>
        <Text>{project.name}</Text>
      </Breadcrumbs>

      <Group justify="space-between">
        <div>
          <Group gap="xs" align="center">
            <Title order={2}>{project.name}</Title>
            {project.project_code && (
              <Text size="sm" c="dimmed" fw={600}>
                ({project.project_code})
              </Text>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            {[project.client_name, [project.municipio, project.estado].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setLinkModalOpen(true)}>
          Vincular Documento
        </Button>
      </Group>

      <ProjectConfigPanel
        project={project}
        profiles={profiles}
        existingDocumentTypeIds={documents.map((d) => d.document_type_id)}
        onChanged={loadAll}
      />

      <ApplicabilityPanel project={project} documents={documents} />

      <ReportsPanel project={project} documents={documents} />

      <ChecklistPanel projectId={projectId} />

      <NonConformitiesPanel projectId={projectId} profiles={profiles} />

      {documents.length === 0 ? (
        <Text c="dimmed">Nenhum documento vinculado a este projeto ainda.</Text>
      ) : (
        <Stack>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              profiles={profiles}
              settings={settings}
              project={project}
              onChanged={loadAll}
            />
          ))}
        </Stack>
      )}

      <Modal opened={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Vincular Documento ao Projeto" centered>
        <form onSubmit={handleLinkDocument}>
          <Stack>
            <Select
              label="Tipo de Documento"
              placeholder="Selecione"
              required
              data={documentTypes.map((t) => ({ value: t.id, label: t.name }))}
              value={linkForm.document_type_id}
              onChange={handleTypeSelected}
            />
            <TextInput
              label="Nome padrão do arquivo"
              description='Ao baixar, o arquivo virá como "nome_REV.ext"'
              required
              value={linkForm.nome_padrao_arquivo}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setLinkForm((f) => ({ ...f, nome_padrao_arquivo: value }));
              }}
            />
            <Select
              label="Responsável pelo próximo fluxo"
              placeholder="Selecione (opcional)"
              clearable
              data={profiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
              value={linkForm.responsible_user_id}
              onChange={(v) => setLinkForm((f) => ({ ...f, responsible_user_id: v }))}
            />
            <Button type="submit" loading={saving}>
              Vincular
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
