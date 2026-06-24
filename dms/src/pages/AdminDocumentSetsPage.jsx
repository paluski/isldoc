import { useEffect, useState } from 'react';
import { Title, Stack, Table, Button, Modal, TextInput, Textarea, Group, ActionIcon, Paper, Select } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const EMPTY_TEMPLATE = { id: null, name: '', description: '' };

export function AdminDocumentSetsPage() {
  const [templates, setTemplates] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [template, setTemplate] = useState(EMPTY_TEMPLATE);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: templatesData, error }, { data: typesData }] = await Promise.all([
      supabase.from('document_set_templates').select('*, document_set_template_items(count)').order('name'),
      supabase.from('document_types').select('*').eq('is_active', true).order('name')
    ]);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar conjuntos: ${error.message}` });
    } else {
      setTemplates(templatesData);
    }
    setDocumentTypes(typesData ?? []);
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
      .from('document_set_template_items')
      .select('*')
      .eq('document_set_template_id', t.id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar itens: ${error.message}` });
      return;
    }
    setItems(data);
    setModalOpen(true);
  }

  function addItem() {
    setItems((it) => [...it, { document_type_id: '', nome_padrao_sugerido: '', _localId: crypto.randomUUID() }]);
  }

  function updateTemplateField(field, value) {
    setTemplate((t) => ({ ...t, [field]: value }));
  }

  function updateItem(index, changes) {
    setItems((it) => it.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function removeItem(index) {
    setItems((it) => it.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (items.length === 0) {
      notifications.show({ color: 'red', message: 'Adicione ao menos um tipo de documento ao conjunto.' });
      return;
    }
    if (items.some((it) => !it.document_type_id)) {
      notifications.show({ color: 'red', message: 'Selecione o tipo de documento em todos os itens.' });
      return;
    }

    setSaving(true);

    let templateId = template.id;
    if (templateId) {
      const { error } = await supabase
        .from('document_set_templates')
        .update({ name: template.name, description: template.description || null })
        .eq('id', templateId);
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao salvar conjunto: ${error.message}` });
        return;
      }
      await supabase.from('document_set_template_items').delete().eq('document_set_template_id', templateId);
    } else {
      const { data, error } = await supabase
        .from('document_set_templates')
        .insert({ name: template.name, description: template.description || null })
        .select()
        .single();
      if (error) {
        setSaving(false);
        notifications.show({ color: 'red', message: `Erro ao criar conjunto: ${error.message}` });
        return;
      }
      templateId = data.id;
    }

    const itemRows = items.map((it) => ({
      document_set_template_id: templateId,
      document_type_id: it.document_type_id,
      nome_padrao_sugerido: it.nome_padrao_sugerido || null
    }));

    const { error: itemsError } = await supabase.from('document_set_template_items').insert(itemRows);
    setSaving(false);

    if (itemsError) {
      notifications.show({ color: 'red', message: `Erro ao salvar itens: ${itemsError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Conjunto de documentos salvo com sucesso!' });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('document_set_templates').delete().eq('id', id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao excluir: ${error.message}` });
      return;
    }
    load();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Conjuntos de Documentos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo Conjunto
        </Button>
      </Group>

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
              <Table.Td>{t.document_set_template_items?.[0]?.count ?? 0}</Table.Td>
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={template.id ? 'Editar Conjunto' : 'Novo Conjunto de Documentos'} size="lg" centered>
        <form onSubmit={handleSave}>
          <Stack>
            <TextInput
              label="Nome do conjunto"
              placeholder="ex: Documentos LRCAP 2026 - Armazenamento"
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
              <span>Documentos exigidos</span>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
                Adicionar Item
              </Button>
            </Group>

            {items.map((item, i) => (
              <Paper key={item._localId ?? item.id} withBorder p="xs" radius="sm">
                <Group wrap="nowrap">
                  <Select
                    placeholder="Tipo de documento"
                    data={documentTypes.map((dt) => ({ value: dt.id, label: dt.name }))}
                    value={item.document_type_id}
                    onChange={(v) => updateItem(i, { document_type_id: v })}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <TextInput
                    placeholder="Nome padrão sugerido (opcional)"
                    value={item.nome_padrao_sugerido}
                    onChange={(e) => updateItem(i, { nome_padrao_sugerido: e.currentTarget.value })}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <ActionIcon variant="subtle" color="red" onClick={() => removeItem(i)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}

            <Button type="submit" loading={saving} mt="md">
              Salvar Conjunto
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
