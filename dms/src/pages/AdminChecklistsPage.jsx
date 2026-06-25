import { useEffect, useState } from 'react';
import { Title, Stack, Table, Button, Modal, TextInput, Textarea, Group, ActionIcon, Paper, Checkbox, Badge, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { IconPlus, IconEdit, IconTrash, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const EMPTY_TEMPLATE = { id: null, name: '', description: '' };

export function AdminChecklistsPage() {
  const [templates, setTemplates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [template, setTemplate] = useState(EMPTY_TEMPLATE);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [schemaError, setSchemaError] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*, checklist_template_items(count)')
      .order('name');
    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('checklist_template')) {
        setSchemaError(true);
        return;
      }
      notifications.show({ color: 'red', message: `Erro ao carregar checklists: ${error.message}` });
    } else {
      setTemplates(data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setTemplate(EMPTY_TEMPLATE);
    setItems([]);
    setModalOpen(true);
  }

  async function openEdit(t) {
    setTemplate({ id: t.id, name: t.name, description: t.description ?? '' });
    const { data, error } = await supabase
      .from('checklist_template_items')
      .select('*')
      .eq('checklist_template_id', t.id)
      .order('item_order');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar itens: ${error.message}` });
      return;
    }
    setItems(data);
    setModalOpen(true);
  }

  function updateTemplateField(field, value) {
    setTemplate((t) => ({ ...t, [field]: value }));
  }

  function addItem() {
    setItems((it) => [...it, { description: '', is_required: true, _localId: crypto.randomUUID() }]);
  }

  function updateItem(index, changes) {
    setItems((it) => it.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function removeItem(index) {
    setItems((it) => it.filter((_, i) => i !== index));
  }

  function moveItem(index, direction) {
    setItems((it) => {
      const next = [...it];
      const target = index + direction;
      if (target < 0 || target >= next.length) return it;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (items.length === 0) {
      notifications.show({ color: 'red', message: 'Adicione ao menos um item ao checklist.' });
      return;
    }
    if (items.some((it) => !it.description)) {
      notifications.show({ color: 'red', message: 'Preencha a descrição de todos os itens.' });
      return;
    }

    setSaving(true);

    let templateId = template.id;
    if (templateId) {
      const { error } = await supabase
        .from('checklist_templates')
        .update({ name: template.name, description: template.description || null })
        .eq('id', templateId);
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao salvar checklist: ${error.message}` });
        return;
      }
      await supabase.from('checklist_template_items').delete().eq('checklist_template_id', templateId);
    } else {
      const { data, error } = await supabase
        .from('checklist_templates')
        .insert({ name: template.name, description: template.description || null })
        .select()
        .single();
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao criar checklist: ${error.message}` });
        return;
      }
      templateId = data.id;
    }

    const itemRows = items.map((it, i) => ({
      checklist_template_id: templateId,
      item_order: i + 1,
      description: it.description,
      is_required: it.is_required
    }));

    const { error: itemsError } = await supabase.from('checklist_template_items').insert(itemRows);
    setSaving(false);

    if (itemsError) {
      notifications.show({ color: 'red', message: `Erro ao salvar itens: ${itemsError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Checklist salvo com sucesso!' });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao excluir: ${error.message}` });
      return;
    }
    load();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Checklists de Auditoria</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={schemaError}>
          Novo Checklist
        </Button>
      </Group>

      {schemaError && (
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" title="Tabela não encontrada">
          As tabelas de checklist (<strong>checklist_templates</strong> e <strong>checklist_template_items</strong>) não foram encontradas no schema cache do Supabase.
          Acesse o painel do Supabase → Settings → API → <strong>Reload Schema Cache</strong> para resolver, ou execute as migrações do banco de dados.
        </Alert>
      )}

      <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Descrição</Table.Th>
            <Table.Th>Itens</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {templates.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>{t.description}</Table.Td>
              <Table.Td>{t.checklist_template_items?.[0]?.count ?? 0}</Table.Td>
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={template.id ? 'Editar Checklist' : 'Novo Checklist'} size="lg" centered>
        <form onSubmit={handleSave}>
          <Stack>
            <TextInput
              label="Nome do checklist"
              placeholder="ex: Auditoria documental LRCAP 2026"
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
              <Title order={5}>Itens do checklist</Title>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
                Adicionar Item
              </Button>
            </Group>

            {items.map((item, i) => (
              <Paper key={item._localId ?? item.id} withBorder p="sm" radius="sm">
                <Group align="flex-start" wrap="nowrap">
                  <Badge variant="light" mt={6}>
                    {i + 1}
                  </Badge>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Descrição do item (ex: ART do responsável técnico anexada e legível)"
                      value={item.description}
                      onChange={(e) => updateItem(i, { description: e.currentTarget.value })}
                      size="sm"
                    />
                    <Checkbox
                      label="Item obrigatório"
                      checked={item.is_required}
                      onChange={(e) => updateItem(i, { is_required: e.currentTarget.checked })}
                      size="sm"
                    />
                  </Stack>
                  <Stack gap={4}>
                    <ActionIcon variant="subtle" onClick={() => moveItem(i, -1)} disabled={i === 0}>
                      <IconArrowUp size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}>
                      <IconArrowDown size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => removeItem(i)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Stack>
                </Group>
              </Paper>
            ))}

            <Button type="submit" loading={saving} mt="md">
              Salvar Checklist
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
