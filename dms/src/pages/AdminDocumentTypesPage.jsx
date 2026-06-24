import { useEffect, useState } from 'react';
import { Title, Stack, Table, Button, Modal, TextInput, Textarea, Switch, Group, ActionIcon } from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const EMPTY_FORM = { id: null, name: '', default_subfolder_name: '', description: '', is_active: true };

export function AdminDocumentTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('document_types').select('*').order('name');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar tipos de documento: ${error.message}` });
    } else {
      setTypes(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(type) {
    setForm(type);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      default_subfolder_name: form.default_subfolder_name,
      description: form.description || null,
      is_active: form.is_active
    };

    const { error } = form.id
      ? await supabase.from('document_types').update(payload).eq('id', form.id)
      : await supabase.from('document_types').insert(payload);

    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao salvar: ${error.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Tipo de documento salvo!' });
    setModalOpen(false);
    load();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Tipos de Documento</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo Tipo
        </Button>
      </Group>

      <Table withTableBorder withColumnBorders striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Subpasta padrão</Table.Th>
            <Table.Th>Ativo</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {types.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>{t.default_subfolder_name}</Table.Td>
              <Table.Td>{t.is_active ? 'Sim' : 'Não'}</Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" onClick={() => openEdit(t)}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'} centered>
        <form onSubmit={handleSave}>
          <Stack>
            <TextInput
              label="Nome"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
            />
            <TextInput
              label="Nome da subpasta padrão"
              description="Ex: Anexo1_Requerimento"
              required
              value={form.default_subfolder_name}
              onChange={(e) => setForm((f) => ({ ...f, default_subfolder_name: e.currentTarget.value }))}
            />
            <Textarea
              label="Descrição"
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
            />
            <Switch
              label="Ativo"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.currentTarget.checked }))}
            />
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
