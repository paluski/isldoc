import { useEffect, useState } from 'react';
import { Paper, Title, Select, Group, Button, Stack, Text, Accordion } from '@mantine/core';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

export function ProjectConfigPanel({ project, profiles, existingDocumentTypeIds, onChanged }) {
  const [workflows, setWorkflows] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);
  const [documentSets, setDocumentSets] = useState([]);
  const [levels, setLevels] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [applyingSet, setApplyingSet] = useState(false);

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

  useEffect(() => {
    loadOptions();
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
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
