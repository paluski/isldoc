import { useEffect, useState } from 'react';
import { Paper, Title, Select, MultiSelect, Group, Button, Stack, Text, Accordion, TextInput } from '@mantine/core';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function ProjectConfigPanel({ project, profiles, existingDocumentTypeIds, onChanged }) {
  const { isAdmin } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);
  const [documentSets, setDocumentSets] = useState([]);
  const [levels, setLevels] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [applyingSet, setApplyingSet] = useState(false);
  const [clientAccessIds, setClientAccessIds] = useState([]);
  const clientProfiles = profiles.filter((p) => p.role === 'cliente_externo');

  async function loadOptions() {
    const [{ data: w }, { data: h }, { data: s }] = await Promise.all([
      supabase.from('workflow_templates').select('id, name').order('name'),
      supabase.from('hierarchy_templates').select('id, name').order('name'),
      supabase.from('document_set_templates').select('id, name').order('name')
    ]);
    setWorkflows(w ?? []);
    setHierarchies(h ?? []);
    setDocumentSets(s ?? []);
  }

  async function loadHierarchyAssignments() {
    if (!project.hierarchy_template_id) {
      setLevels([]);
      setAssignments({});
      return;
    }
    const [{ data: levelsData }, { data: assignmentsData }] = await Promise.all([
      supabase
        .from('hierarchy_template_levels')
        .select('*')
        .eq('hierarchy_template_id', project.hierarchy_template_id)
        .order('level_order'),
      supabase.from('project_hierarchy_assignments').select('*').eq('project_id', project.id)
    ]);
    setLevels(levelsData ?? []);
    setAssignments(Object.fromEntries((assignmentsData ?? []).map((a) => [a.hierarchy_template_level_id, a.user_id])));
  }

  async function loadClientAccess() {
    const { data } = await supabase.from('project_client_access').select('client_user_id').eq('project_id', project.id);
    setClientAccessIds((data ?? []).map((r) => r.client_user_id));
  }

  useEffect(() => {
    loadOptions();
    loadClientAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadHierarchyAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.hierarchy_template_id]);

  async function updateProjectField(field, value) {
    const { error } = await supabase
      .from('projects')
      .update({ [field]: value || null })
      .eq('id', project.id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao atualizar projeto: ${error.message}` });
      return;
    }
    onChanged();
  }

  async function handleAssignLevel(levelId, userId) {
    const { error } = await supabase
      .from('project_hierarchy_assignments')
      .upsert({ project_id: project.id, hierarchy_template_level_id: levelId, user_id: userId || null }, { onConflict: 'project_id,hierarchy_template_level_id' });
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao atribuir responsável: ${error.message}` });
      return;
    }
    setAssignments((a) => ({ ...a, [levelId]: userId }));
  }

  async function handleClientAccessChange(newIds) {
    const added = newIds.filter((id) => !clientAccessIds.includes(id));
    const removed = clientAccessIds.filter((id) => !newIds.includes(id));

    if (added.length > 0) {
      const { error } = await supabase
        .from('project_client_access')
        .insert(added.map((client_user_id) => ({ project_id: project.id, client_user_id })));
      if (error) {
        notifications.show({ color: 'red', message: `Erro ao liberar acesso: ${error.message}` });
        return;
      }
    }
    if (removed.length > 0) {
      const { error } = await supabase
        .from('project_client_access')
        .delete()
        .eq('project_id', project.id)
        .in('client_user_id', removed);
      if (error) {
        notifications.show({ color: 'red', message: `Erro ao remover acesso: ${error.message}` });
        return;
      }
    }
    setClientAccessIds(newIds);
  }

  async function handleApplyDocumentSet() {
    if (!project.document_set_template_id) return;
    setApplyingSet(true);

    const { data: items, error } = await supabase
      .from('document_set_template_items')
      .select('*, document_types(name, default_subfolder_name)')
      .eq('document_set_template_id', project.document_set_template_id);

    if (error) {
      setApplyingSet(false);
      notifications.show({ color: 'red', message: `Erro ao carregar conjunto: ${error.message}` });
      return;
    }

    const newItems = items.filter((it) => !existingDocumentTypeIds.includes(it.document_type_id));

    if (newItems.length === 0) {
      setApplyingSet(false);
      notifications.show({ color: 'blue', message: 'Todos os documentos deste conjunto já estão vinculados ao projeto.' });
      return;
    }

    const rows = newItems.map((it) => ({
      project_id: project.id,
      document_type_id: it.document_type_id,
      nome_padrao_arquivo: it.nome_padrao_sugerido || `${project.name}_${it.document_types?.default_subfolder_name ?? it.document_type_id}`
    }));

    const { error: insertError } = await supabase.from('project_documents').insert(rows);
    setApplyingSet(false);

    if (insertError) {
      notifications.show({ color: 'red', message: `Erro ao aplicar conjunto: ${insertError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: `${newItems.length} documento(s) adicionado(s) ao projeto.` });
    onChanged();
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Accordion variant="contained" defaultValue={null}>
        <Accordion.Item value="config">
          <Accordion.Control>
            <Title order={4}>Configurações do Projeto</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack>
              <Group grow>
                <TextInput
                  key={`code-${project.project_code}`}
                  label="Código do Projeto"
                  defaultValue={project.project_code || ''}
                  onBlur={(e) => updateProjectField('project_code', e.currentTarget.value)}
                />
                <TextInput
                  key={`client-${project.client_name}`}
                  label="Cliente"
                  defaultValue={project.client_name || ''}
                  onBlur={(e) => updateProjectField('client_name', e.currentTarget.value)}
                />
              </Group>

              <Select
                label="Fluxo de aprovação"
                clearable
                data={workflows.map((w) => ({ value: w.id, label: w.name }))}
                value={project.workflow_template_id}
                onChange={(v) => updateProjectField('workflow_template_id', v)}
              />
              <Select
                label="Hierarquia"
                clearable
                data={hierarchies.map((h) => ({ value: h.id, label: h.name }))}
                value={project.hierarchy_template_id}
                onChange={(v) => updateProjectField('hierarchy_template_id', v)}
              />

              {levels.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Responsáveis por nível (hierarquia deste projeto)
                  </Text>
                  {levels.map((lvl) => (
                    <Select
                      key={lvl.id}
                      label={lvl.name}
                      placeholder="Selecione a pessoa"
                      clearable
                      data={profiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
                      value={assignments[lvl.id] ?? null}
                      onChange={(v) => handleAssignLevel(lvl.id, v)}
                    />
                  ))}
                </Stack>
              )}

              <Group align="flex-end">
                <Select
                  label="Conjunto de documentos"
                  clearable
                  style={{ flex: 1 }}
                  data={documentSets.map((s) => ({ value: s.id, label: s.name }))}
                  value={project.document_set_template_id}
                  onChange={(v) => updateProjectField('document_set_template_id', v)}
                />
                <Button
                  leftSection={<IconPlaylistAdd size={16} />}
                  onClick={handleApplyDocumentSet}
                  loading={applyingSet}
                  disabled={!project.document_set_template_id}
                >
                  Aplicar Conjunto
                </Button>
              </Group>

              {isAdmin && (
                <MultiSelect
                  label="Acesso de clientes externos"
                  description="Quem tiver papel 'Cliente Externo' e estiver listado aqui pode ver os documentos emitidos deste projeto"
                  placeholder={clientProfiles.length === 0 ? 'Nenhum usuário com papel Cliente Externo cadastrado' : 'Selecione clientes'}
                  data={clientProfiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
                  value={clientAccessIds}
                  onChange={handleClientAccessChange}
                  disabled={clientProfiles.length === 0}
                  searchable
                  clearable
                />
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
