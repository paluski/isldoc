import { useState } from 'react';
import { Modal, Stack, TextInput, Textarea, Select, Button, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

const SEVERITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' }
];

export function RegisterNonConformityModal({ opened, onClose, projectId, profiles, onRegistered }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('media');
  const [responsibleUserId, setResponsibleUserId] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
    setSeverity('media');
    setResponsibleUserId(null);
    setDueDate(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      notifications.show({ color: 'red', message: 'Informe um título para a não conformidade.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('non_conformities').insert({
      project_id: projectId,
      title: title.trim(),
      description: description || null,
      severity,
      responsible_user_id: responsibleUserId || null,
      due_date: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      opened_by: user.id
    });
    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao registrar não conformidade: ${error.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Não conformidade registrada!' });
    reset();
    onClose();
    onRegistered();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Registrar Não Conformidade" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text size="xs" c="dimmed">Campos marcados com <Text span c="red" fw={700}>*</Text> são obrigatórios.</Text>
          <TextInput
            label={<>Título <Text span c="red" fw={700}>*</Text></>}
            withAsterisk={false}
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <Textarea label="Descrição" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={3} />
          <Select
            label={<>Severidade <Text span c="red" fw={700}>*</Text></>}
            withAsterisk={false}
            data={SEVERITY_OPTIONS}
            value={severity}
            onChange={setSeverity}
          />
          <Select
            label="Responsável pela tratativa"
            placeholder="Selecione (opcional)"
            clearable
            data={profiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
            value={responsibleUserId}
            onChange={setResponsibleUserId}
          />
          <DateInput label="Prazo" placeholder="Selecione a data" value={dueDate} onChange={setDueDate} clearable />
          <Button type="submit" loading={saving}>
            Registrar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
