import { useEffect, useState } from 'react';
import { Paper, Title, Button, Stack, Group, Text, Badge, Accordion, Table } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { RunChecklistModal } from './RunChecklistModal';

const RESULT_LABELS = {
  conforme: 'Conforme',
  nao_conforme: 'Não Conforme',
  nao_aplicavel: 'N/A'
};

const RESULT_COLORS = {
  conforme: 'green',
  nao_conforme: 'red',
  nao_aplicavel: 'gray'
};

export function ChecklistPanel({ projectId }) {
  const [responses, setResponses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from('checklist_responses')
      .select(
        '*, checklist_templates(name), profiles(full_name), checklist_response_items(id, result, observacao, checklist_template_items(description))'
      )
      .eq('project_id', projectId)
      .order('performed_at', { ascending: false });

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar checklists: ${error.message}` });
      return;
    }
    setResponses(data ?? []);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  function percentual(items) {
    const conforme = items.filter((i) => i.result === 'conforme').length;
    const naoConforme = items.filter((i) => i.result === 'nao_conforme').length;
    const avaliaveis = conforme + naoConforme;
    return avaliaveis > 0 ? Math.round((conforme / avaliaveis) * 100) : 100;
  }

  return (
    <Paper withBorder p="md" radius="lg">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Checklists de Auditoria</Title>
        <Button size="xs" leftSection={<IconClipboardCheck size={14} />} onClick={() => setModalOpen(true)}>
          Realizar Checklist
        </Button>
      </Group>

      {responses.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nenhum checklist realizado para este projeto ainda.
        </Text>
      ) : (
        <Accordion variant="separated">
          {responses.map((r) => {
            const pct = percentual(r.checklist_response_items);
            return (
              <Accordion.Item key={r.id} value={r.id}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text size="sm" fw={600}>
                        {r.checklist_templates?.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {r.profiles?.full_name || 'Usuário'} — {new Date(r.performed_at).toLocaleString('pt-BR')}
                      </Text>
                    </div>
                    <Badge color={pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red'} size="lg">
                      {pct}%
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Table verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Item</Table.Th>
                        <Table.Th>Resultado</Table.Th>
                        <Table.Th>Observação</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {r.checklist_response_items.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>{item.checklist_template_items?.description}</Table.Td>
                          <Table.Td>
                            <Badge color={RESULT_COLORS[item.result]} variant="light" size="sm">
                              {RESULT_LABELS[item.result]}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{item.observacao || '—'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  {r.notes && (
                    <Text size="xs" c="dimmed" mt="xs">
                      Observações gerais: {r.notes}
                    </Text>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      <RunChecklistModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        onSubmitted={load}
      />
    </Paper>
  );
}
