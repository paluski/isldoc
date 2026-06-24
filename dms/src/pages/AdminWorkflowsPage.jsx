import { useEffect, useState } from 'react';
import {
  Title,
  Stack,
  Table,
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Select,
  Paper,
  Text,
  Badge
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const EMPTY_TEMPLATE = { id: null, name: '', description: '' };
const EMPTY_STEP = { name: '', approver_type: 'hierarchy_level', approver_level_name: '', specific_user_id: '' };

export function AdminWorkflowsPage() {
  const [templates, setTemplates] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [template, setTemplate] = useState(EMPTY_TEMPLATE);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: templatesData, error }, { data: profilesData }] = await Promise.all([
      supabase.from('workflow_templates').select('*, workflow_template_steps(count)').order('name'),
      supabase.from('profiles').select('*').order('full_name')
    ]);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar fluxos: ${error.message}` });
    } else {
      setTemplates(templatesData);
    }
    setProfiles(profilesData ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setTemplate(EMPTY_TEMPLATE);
    setSteps([]);
    setModalOpen(true);
  }

  function updateTemplateField(field, value) {
    setTemplate((t) => ({ ...t, [field]: value }));
  }

  async function openEdit(t) {
    setTemplate({ id: t.id, name: t.name, description: t.description ?? '' });
    const { data, error } = await supabase
      .from('workflow_template_steps')
      .select('*')
      .eq('workflow_template_id', t.id)
      .order('step_order');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar etapas: ${error.message}` });
      return;
    }
    setSteps(data);
    setModalOpen(true);
  }

  function addStep() {
    setSteps((s) => [...s, { ...EMPTY_STEP, _localId: crypto.randomUUID() }]);
  }

  function updateStep(index, changes) {
    setSteps((s) => s.map((step, i) => (i === index ? { ...step, ...changes } : step)));
  }

  function removeStep(index) {
    setSteps((s) => s.filter((_, i) => i !== index));
  }

  function moveStep(index, direction) {
    setSteps((s) => {
      const next = [...s];
      const target = index + direction;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (steps.length === 0) {
      notifications.show({ color: 'red', message: 'Adicione ao menos uma etapa ao fluxo.' });
      return;
    }
    for (const s of steps) {
      if (!s.name || (s.approver_type === 'hierarchy_level' && !s.approver_level_name) || (s.approver_type === 'specific_user' && !s.specific_user_id)) {
        notifications.show({ color: 'red', message: 'Preencha todos os campos de cada etapa.' });
        return;
      }
    }

    setSaving(true);

    let templateId = template.id;
    if (templateId) {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ name: template.name, description: template.description || null })
        .eq('id', templateId);
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao salvar fluxo: ${error.message}` });
        return;
      }
      await supabase.from('workflow_template_steps').delete().eq('workflow_template_id', templateId);
    } else {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({ name: template.name, description: template.description || null })
        .select()
        .single();
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao criar fluxo: ${error.message}` });
        return;
      }
      templateId = data.id;
    }

    const stepRows = steps.map((s, i) => ({
      workflow_template_id: templateId,
      step_order: i + 1,
      name: s.name,
      approver_type: s.approver_type,
      approver_level_name: s.approver_type === 'hierarchy_level' ? s.approver_level_name : null,
      specific_user_id: s.approver_type === 'specific_user' ? s.specific_user_id : null
    }));

    const { error: stepsError } = await supabase.from('workflow_template_steps').insert(stepRows);
    setSaving(false);

    if (stepsError) {
      notifications.show({ color: 'red', message: `Erro ao salvar etapas: ${stepsError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Fluxo salvo com sucesso!' });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('workflow_templates').delete().eq('id', id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao excluir: ${error.message}` });
      return;
    }
    load();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Fluxos de Aprovação</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo Fluxo
        </Button>
      </Group>

      <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Descrição</Table.Th>
            <Table.Th>Etapas</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {templates.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>{t.description}</Table.Td>
              <Table.Td>{t.workflow_template_steps?.[0]?.count ?? 0}</Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" onClick={() => openEdit(t)}>
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(t.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={template.id ? 'Editar Fluxo' : 'Novo Fluxo'} size="lg" centered>
        <form onSubmit={handleSave}>
          <Stack>
            <TextInput
              label="Nome do fluxo"
              required
              value={template.name}
              onChange={(e) => updateTemplateField('name', e.currentTarget.value)}
            />
            <Textarea
              label="Descrição"
              value={template.description}
              onChange={(e) => updateTemplateField('description', e.currentTarget.value)}
            />

            <Group justify="space-between" mt="sm">
              <Text fw={600} size="sm">
                Etapas (em ordem)
              </Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addStep}>
                Adicionar Etapa
              </Button>
            </Group>

            {steps.map((step, i) => (
              <Paper key={step._localId ?? step.id} withBorder p="sm" radius="sm">
                <Group align="flex-start" wrap="nowrap">
                  <Badge variant="light" mt={6}>
                    {i + 1}
                  </Badge>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Nome da etapa (ex: Verificação técnica)"
                      value={step.name}
                      onChange={(e) => updateStep(i, { name: e.currentTarget.value })}
                      size="sm"
                    />
                    <Group grow>
                      <Select
                        size="sm"
                        data={[
                          { value: 'hierarchy_level', label: 'Nível de hierarquia' },
                          { value: 'specific_user', label: 'Usuário específico' }
                        ]}
                        value={step.approver_type}
                        onChange={(v) => updateStep(i, { approver_type: v })}
                      />
                      {step.approver_type === 'hierarchy_level' ? (
                        <TextInput
                          size="sm"
                          placeholder="Nome do nível (ex: Verificador)"
                          value={step.approver_level_name}
                          onChange={(e) => updateStep(i, { approver_level_name: e.currentTarget.value })}
                        />
                      ) : (
                        <Select
                          size="sm"
                          placeholder="Selecione o usuário"
                          data={profiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
                          value={step.specific_user_id}
                          onChange={(v) => updateStep(i, { specific_user_id: v })}
                        />
                      )}
                    </Group>
                  </Stack>
                  <Stack gap={4}>
                    <ActionIcon variant="subtle" onClick={() => moveStep(i, -1)} disabled={i === 0}>
                      <IconArrowUp size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}>
                      <IconArrowDown size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => removeStep(i)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Stack>
                </Group>
              </Paper>
            ))}

            <Button type="submit" loading={saving} mt="md">
              Salvar Fluxo
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
