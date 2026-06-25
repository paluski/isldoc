import { useEffect, useState } from 'react';
import { Paper, Title, Button, Stack, Group, Text, Badge, Accordion, Textarea, Select, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { RegisterNonConformityModal } from './RegisterNonConformityModal';

const SEVERITY_COLORS = { baixa: 'gray', media: 'yellow', alta: 'orange', critica: 'red' };
const STATUS_COLORS = { aberta: 'red', em_tratativa: 'yellow', encerrada: 'green' };
const STATUS_LABELS = { aberta: 'Aberta', em_tratativa: 'Em tratativa', encerrada: 'Encerrada' };

export function NonConformitiesPanel({ projectId, profiles }) {
  const { user } = useAuth();
  const [ncs, setNcs] = useState([]);
  const [actionsByNc, setActionsByNc] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newAction, setNewAction] = useState({});
  const [closingNotes, setClosingNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const { data, error } = await supabase
      .from('non_conformities')
      .select('*, profiles!non_conformities_responsible_user_id_fkey(full_name)')
      .eq('project_id', projectId)
      .order('opened_at', { ascending: false });

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar não conformidades: ${error.message}` });
      return;
    }
    setNcs(data ?? []);
  }

  async function loadActions(ncId) {
    const { data, error } = await supabase
      .from('non_conformity_actions')
      .select('*, profiles(full_name)')
      .eq('non_conformity_id', ncId)
      .order('created_at');
    if (!error) {
      setActionsByNc((m) => ({ ...m, [ncId]: data ?? [] }));
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function handleAddAction(ncId) {
    const text = newAction[ncId];
    if (!text?.trim()) return;
    setBusyId(ncId);
    const { error } = await supabase.from('non_conformity_actions').insert({
      non_conformity_id: ncId,
      user_id: user.id,
      action_text: text.trim()
    });

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao registrar tratativa: ${error.message}` });
      setBusyId(null);
      return;
    }

    await supabase.from('non_conformities').update({ status: 'em_tratativa' }).eq('id', ncId).eq('status', 'aberta');

    setNewAction((m) => ({ ...m, [ncId]: '' }));
    await loadActions(ncId);
    await load();
    setBusyId(null);
  }

  async function handleClose(ncId) {
    setBusyId(ncId);
    const { error } = await supabase
      .from('non_conformities')
      .update({
        status: 'encerrada',
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        closing_notes: closingNotes[ncId] || null
      })
      .eq('id', ncId);
    setBusyId(null);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao encerrar: ${error.message}` });
      return;
    }
    notifications.show({ color: 'green', message: 'Não conformidade encerrada.' });
    load();
  }

  return (
    <Paper withBorder p="md" radius="lg">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Não Conformidades</Title>
        <Button size="xs" color="red" leftSection={<IconAlertTriangle size={14} />} onClick={() => setModalOpen(true)}>
          Registrar Não Conformidade
        </Button>
      </Group>

      {ncs.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nenhuma não conformidade registrada para este projeto.
        </Text>
      ) : (
        <Accordion variant="separated" onChange={(value) => value && loadActions(value)}>
          {ncs.map((nc) => (
            <Accordion.Item key={nc.id} value={nc.id}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Group gap="xs">
                      <Text size="sm" fw={600}>
                        {nc.title}
                      </Text>
                      <Badge size="xs" color={SEVERITY_COLORS[nc.severity]} variant="light">
                        {nc.severity}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Responsável: {nc.profiles?.full_name || '—'}
                      {nc.due_date && ` · Prazo: ${new Date(nc.due_date).toLocaleDateString('pt-BR')}`}
                    </Text>
                  </div>
                  <Badge color={STATUS_COLORS[nc.status]}>{STATUS_LABELS[nc.status]}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {nc.description && <Text size="sm">{nc.description}</Text>}

                  <Stack gap={6}>
                    <Text size="xs" fw={600} c="dimmed">
                      Histórico de tratativas
                    </Text>
                    {(actionsByNc[nc.id] ?? []).length === 0 ? (
                      <Text size="xs" c="dimmed">
                        Nenhuma tratativa registrada ainda.
                      </Text>
                    ) : (
                      (actionsByNc[nc.id] ?? []).map((a) => (
                        <Paper key={a.id} withBorder p="xs" radius="sm" bg="gray.0">
                          <Text size="xs" fw={600}>
                            {a.profiles?.full_name || 'Usuário'}{' '}
                            <Text span c="dimmed" size="xs">
                              {new Date(a.created_at).toLocaleString('pt-BR')}
                            </Text>
                          </Text>
                          <Text size="sm">{a.action_text}</Text>
                        </Paper>
                      ))
                    )}
                  </Stack>

                  {nc.status !== 'encerrada' && (
                    <>
                      <Group align="flex-end">
                        <Textarea
                          placeholder="Descreva a tratativa realizada"
                          style={{ flex: 1 }}
                          minRows={1}
                          autosize
                          value={newAction[nc.id] || ''}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            setNewAction((m) => ({ ...m, [nc.id]: value }));
                          }}
                        />
                        <Button size="xs" loading={busyId === nc.id} onClick={() => handleAddAction(nc.id)}>
                          Adicionar
                        </Button>
                      </Group>

                      <Group align="flex-end">
                        <TextInput
                          placeholder="Observação de encerramento (opcional)"
                          style={{ flex: 1 }}
                          value={closingNotes[nc.id] || ''}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            setClosingNotes((m) => ({ ...m, [nc.id]: value }));
                          }}
                        />
                        <Button size="xs" color="green" leftSection={<IconCheck size={14} />} loading={busyId === nc.id} onClick={() => handleClose(nc.id)}>
                          Encerrar
                        </Button>
                      </Group>
                    </>
                  )}

                  {nc.status === 'encerrada' && (
                    <Text size="xs" c="dimmed">
                      Encerrada em {new Date(nc.closed_at).toLocaleString('pt-BR')}
                      {nc.closing_notes && ` — ${nc.closing_notes}`}
                    </Text>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <RegisterNonConformityModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        profiles={profiles}
        onRegistered={load}
      />
    </Paper>
  );
}
