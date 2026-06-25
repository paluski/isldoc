import { useEffect, useState } from 'react';
import { Modal, Stack, Select, Text, SegmentedControl, Textarea, Paper, Group, Badge, Button, Progress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

const RESULT_OPTIONS = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'nao_conforme', label: 'Não Conforme' },
  { value: 'nao_aplicavel', label: 'N/A' }
];

export function RunChecklistModal({ opened, onClose, projectId, onSubmitted }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [items, setItems] = useState([]);
  const [responses, setResponses] = useState({});
  const [observations, setObservations] = useState({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (opened) {
      supabase
        .from('checklist_templates')
        .select('id, name')
        .order('name')
        .then(({ data }) => setTemplates(data ?? []));
      setTemplateId(null);
      setItems([]);
      setResponses({});
      setObservations({});
      setNotes('');
    }
  }, [opened]);

  async function handleSelectTemplate(id) {
    setTemplateId(id);
    const { data, error } = await supabase
      .from('checklist_template_items')
      .select('*')
      .eq('checklist_template_id', id)
      .order('item_order');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar itens: ${error.message}` });
      return;
    }
    setItems(data);
    setResponses(Object.fromEntries(data.map((it) => [it.id, 'conforme'])));
  }

  const answeredCount = Object.keys(responses).length;
  const conformeCount = Object.values(responses).filter((r) => r === 'conforme').length;
  const naoConformeCount = Object.values(responses).filter((r) => r === 'nao_conforme').length;
  const avaliaveis = conformeCount + naoConformeCount;
  const percentual = avaliaveis > 0 ? Math.round((conformeCount / avaliaveis) * 100) : 100;

  async function handleSubmit() {
    if (!templateId || items.length === 0) {
      notifications.show({ color: 'red', message: 'Selecione um checklist com itens.' });
      return;
    }
    setSaving(true);

    const { data: response, error: responseError } = await supabase
      .from('checklist_responses')
      .insert({
        checklist_template_id: templateId,
        project_id: projectId,
        performed_by: user.id,
        notes: notes || null
      })
      .select()
      .single();

    if (responseError) {
      setSaving(false);
      notifications.show({ color: 'red', message: `Erro ao registrar checklist: ${responseError.message}` });
      return;
    }

    const itemRows = items.map((it) => ({
      checklist_response_id: response.id,
      checklist_template_item_id: it.id,
      result: responses[it.id] || 'nao_aplicavel',
      observacao: observations[it.id] || null
    }));

    const { error: itemsError } = await supabase.from('checklist_response_items').insert(itemRows);
    setSaving(false);

    if (itemsError) {
      notifications.show({ color: 'red', message: `Erro ao salvar respostas: ${itemsError.message}` });
      return;
    }

    notifications.show({ color: 'green', message: `Checklist concluído — ${percentual}% de conformidade.` });
    onClose();
    onSubmitted();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Realizar Checklist de Auditoria" size="lg" centered>
      <Stack>
        <Select
          label="Checklist"
          placeholder="Selecione o checklist a aplicar"
          data={templates.map((t) => ({ value: t.id, label: t.name }))}
          value={templateId}
          onChange={handleSelectTemplate}
        />

        {items.length > 0 && (
          <>
            <Progress.Root size={20}>
              <Progress.Section value={percentual} color={percentual >= 70 ? 'green' : percentual >= 40 ? 'yellow' : 'red'}>
                <Progress.Label>{percentual}% conforme</Progress.Label>
              </Progress.Section>
            </Progress.Root>

            <Stack gap="sm">
              {items.map((item) => (
                <Paper key={item.id} withBorder p="sm" radius="sm">
                  <Group justify="space-between" mb="xs" wrap="nowrap">
                    <Text size="sm" fw={500}>
                      {item.description}
                    </Text>
                    {item.is_required && (
                      <Badge size="xs" color="red" variant="light">
                        obrigatório
                      </Badge>
                    )}
                  </Group>
                  <SegmentedControl
                    fullWidth
                    size="xs"
                    data={RESULT_OPTIONS}
                    value={responses[item.id] || 'conforme'}
                    onChange={(v) => setResponses((r) => ({ ...r, [item.id]: v }))}
                  />
                  {responses[item.id] === 'nao_conforme' && (
                    <Textarea
                      mt="xs"
                      size="xs"
                      placeholder="Observação sobre a não conformidade"
                      value={observations[item.id] || ''}
                      onChange={(e) => setObservations((o) => ({ ...o, [item.id]: e.currentTarget.value }))}
                    />
                  )}
                </Paper>
              ))}
            </Stack>

            <Textarea label="Observações gerais (opcional)" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} minRows={2} />

            <Button onClick={handleSubmit} loading={saving}>
              Concluir Checklist
            </Button>
          </>
        )}
      </Stack>
    </Modal>
  );
}
