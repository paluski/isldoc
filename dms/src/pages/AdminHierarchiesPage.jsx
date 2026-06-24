import { useEffect, useState } from 'react';
import { Title, Stack, Table, Button, Modal, TextInput, Textarea, Group, ActionIcon, Paper, Badge } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const EMPTY_TEMPLATE = { id: null, name: '', description: '' };

export function AdminHierarchiesPage() {
  const [templates, setTemplates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [template, setTemplate] = useState(EMPTY_TEMPLATE);
  const [levels, setLevels] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from('hierarchy_templates')
      .select('*, hierarchy_template_levels(count)')
      .order('name');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar hierarquias: ${error.message}` });
    } else {
      setTemplates(data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setTemplate(EMPTY_TEMPLATE);
    setLevels([]);
    setModalOpen(true);
  }

  async function openEdit(t) {
    setTemplate({ id: t.id, name: t.name, description: t.description ?? '' });
    const { data, error } = await supabase
      .from('hierarchy_template_levels')
      .select('*')
      .eq('hierarchy_template_id', t.id)
      .order('level_order');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar níveis: ${error.message}` });
      return;
    }
    setLevels(data);
    setModalOpen(true);
  }

  function addLevel() {
    setLevels((l) => [...l, { name: '', _localId: crypto.randomUUID() }]);
  }

  function updateLevel(index, name) {
    setLevels((l) => l.map((lvl, i) => (i === index ? { ...lvl, name } : lvl)));
  }

  function removeLevel(index) {
    setLevels((l) => l.filter((_, i) => i !== index));
  }

  function moveLevel(index, direction) {
    setLevels((l) => {
      const next = [...l];
      const target = index + direction;
      if (target < 0 || target >= next.length) return l;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (levels.length === 0) {
      notifications.show({ color: 'red', message: 'Adicione ao menos um nível à hierarquia.' });
      return;
    }
    if (levels.some((l) => !l.name)) {
      notifications.show({ color: 'red', message: 'Preencha o nome de todos os níveis.' });
      return;
    }

    setSaving(true);

    let templateId = template.id;
    if (templateId) {
      const { error } = await supabase
        .from('hierarchy_templates')
        .update({ name: template.name, description: template.description || null })
        .eq('id', templateId);
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao salvar hierarquia: ${error.message}` });
        return;
      }
      await supabase.from('hierarchy_template_levels').delete().eq('hierarchy_template_id', templateId);
    } else {
      const { data, error } = await supabase
        .from('hierarchy_templates')
        .insert({ name: template.name, description: template.description || null })
        .select()
        .single();
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao criar hierarquia: ${error.message}` });
        return;
      }
      templateId = data.id;
    }

    const levelRows = levels.map((l, i) => ({
      hierarchy_template_id: templateId,
      level_order: i + 1,
      name: l.name
    }));

    const { error: levelsError } = await supabase.from('hierarchy_template_levels').insert(levelRows);
    setSaving(false);

    if (levelsError) {
      notifications.show({ color: 'red', message: `Erro ao salvar níveis: ${levelsError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Hierarquia salva com sucesso!' });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('hierarchy_templates').delete().eq('id', id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao excluir: ${error.message}` });
      return;
    }
    load();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Hierarquias</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nova Hierarquia
        </Button>
      </Group>

      <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Descrição</Table.Th>
            <Table.Th>Níveis</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {templates.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>{t.description}</Table.Td>
              <Table.Td>{t.hierarchy_template_levels?.[0]?.count ?? 0}</Table.Td>
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={template.id ? 'Editar Hierarquia' : 'Nova Hierarquia'} centered>
        <form onSubmit={handleSave}>
          <Stack>
            <TextInput
              label="Nome da hierarquia"
              placeholder="ex: Padrão Engenharia"
              required
              value={template.name}
              onChange={(e) => setTemplate((t) => ({ ...t, name: e.currentTarget.value }))}
            />
            <Textarea
              label="Descrição"
              value={template.description}
              onChange={(e) => setTemplate((t) => ({ ...t, description: e.currentTarget.value }))}
            />

            <Group justify="space-between" mt="sm">
              <Group gap="xs">
                <span>Níveis (em ordem)</span>
              </Group>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addLevel}>
                Adicionar Nível
              </Button>
            </Group>

            {levels.map((lvl, i) => (
              <Paper key={lvl._localId ?? lvl.id} withBorder p="xs" radius="sm">
                <Group wrap="nowrap">
                  <Badge variant="light">{i + 1}</Badge>
                  <TextInput
                    placeholder="ex: Elaborador, Verificador, Aprovador..."
                    value={lvl.name}
                    onChange={(e) => updateLevel(i, e.currentTarget.value)}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <ActionIcon variant="subtle" onClick={() => moveLevel(i, -1)} disabled={i === 0}>
                    <IconArrowUp size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" onClick={() => moveLevel(i, 1)} disabled={i === levels.length - 1}>
                    <IconArrowDown size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => removeLevel(i)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}

            <Button type="submit" loading={saving} mt="md">
              Salvar Hierarquia
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
