import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Title, Stack, Paper, Group, Text, Badge, Button, Textarea, Loader, Center, Anchor, Select } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { decideStep } from '../lib/workflowEngine';

export function MyApprovalsPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [projectFilter, setProjectFilter] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('revision_approval_steps')
      .select(
        `*, document_revisions(id, revision_code, file_name, project_documents!document_revisions_project_document_id_fkey(id, nome_padrao_arquivo, project_id, document_types(name), projects(id, name)))`
      )
      .eq('approver_user_id', user.id)
      .eq('status', 'pendente')
      .order('created_at');

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar aprovações pendentes: ${error.message}` });
    } else {
      setPending(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDecide(step, approved) {
    setBusyId(step.id);
    try {
      await decideStep({
        stepId: step.id,
        documentRevisionId: step.document_revisions.id,
        approved,
        comment: comments[step.id] || ''
      });
      notifications.show({ color: approved ? 'green' : 'red', message: approved ? 'Etapa aprovada!' : 'Etapa reprovada.' });
      load();
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro: ${err.message}` });
    }
    setBusyId(null);
  }

  if (loading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  const projectOptions = [...new Map(
    pending
      .map((s) => s.document_revisions?.project_documents?.projects)
      .filter(Boolean)
      .map((p) => [p.id, p])
  ).values()].map((p) => ({ value: p.id, label: p.name }));

  const filtered = projectFilter ? pending.filter((s) => s.document_revisions?.project_documents?.projects?.id === projectFilter) : pending;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Minhas Aprovações Pendentes</Title>
        {projectOptions.length > 1 && (
          <Select
            placeholder="Filtrar por projeto"
            clearable
            data={projectOptions}
            value={projectFilter}
            onChange={setProjectFilter}
            w={260}
          />
        )}
      </Group>

      {pending.length === 0 ? (
        <Text c="dimmed">Nenhuma aprovação pendente para você no momento.</Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed">Nenhuma aprovação pendente para o projeto selecionado.</Text>
      ) : (
        filtered.map((step) => {
          const doc = step.document_revisions?.project_documents;
          return (
            <Paper key={step.id} withBorder p="md" radius="md">
              <Group justify="space-between" mb="xs">
                <div>
                  <Anchor component={Link} to={`/projects/${doc?.project_id}`} fw={600}>
                    {doc?.projects?.name}
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    {doc?.document_types?.name} — {doc?.nome_padrao_arquivo}
                  </Text>
                </div>
                <Badge color="yellow" variant="light">
                  Etapa {step.step_order}: {step.name}
                </Badge>
              </Group>

              <Text size="sm" mb="xs">
                Revisão: <strong>{step.document_revisions?.revision_code}</strong> ({step.document_revisions?.file_name})
              </Text>

              <Textarea
                placeholder="Comentário (opcional)"
                value={comments[step.id] || ''}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setComments((c) => ({ ...c, [step.id]: value }));
                }}
                minRows={1}
                autosize
                mb="xs"
              />

              <Group>
                <Button
                  size="xs"
                  color="green"
                  leftSection={<IconCheck size={14} />}
                  loading={busyId === step.id}
                  onClick={() => handleDecide(step, true)}
                >
                  Aprovar
                </Button>
                <Button
                  size="xs"
                  color="red"
                  leftSection={<IconX size={14} />}
                  loading={busyId === step.id}
                  onClick={() => handleDecide(step, false)}
                >
                  Reprovar
                </Button>
              </Group>
            </Paper>
          );
        })
      )}
    </Stack>
  );
}
