import { useEffect, useState } from 'react';
import { Stack, Group, Badge, Text, Button, Textarea, Paper, Alert } from '@mantine/core';
import { IconSend, IconCheck, IconX, IconCertificate, IconFlagFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { instantiateApprovalSteps, decideStep, emitRevision, finalizeRevision } from '../lib/workflowEngine';

const STATUS_COLORS = { pendente: 'yellow', aprovado: 'green', reprovado: 'red' };

export function ApprovalStepsPanel({ revision, projectDocument, project, settings, onChanged }) {
  const { user, isAdmin } = useAuth();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadSteps() {
    setLoading(true);
    const { data, error } = await supabase
      .from('revision_approval_steps')
      .select('*, profiles(full_name)')
      .eq('document_revision_id', revision.id)
      .order('step_order');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar etapas de aprovação: ${error.message}` });
    } else {
      setSteps(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSteps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision.id]);

  async function handleSendForApproval() {
    setBusy(true);
    try {
      await instantiateApprovalSteps({
        documentRevisionId: revision.id,
        projectId: project.id,
        workflowTemplateId: project.workflow_template_id
      });
      notifications.show({ color: 'green', message: 'Documento enviado para aprovação!' });
      await loadSteps();
      onChanged();
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao enviar para aprovação: ${err.message}` });
    }
    setBusy(false);
  }

  async function handleDecide(step, approved) {
    setBusy(true);
    try {
      await decideStep({ stepId: step.id, documentRevisionId: revision.id, approved, comment });
      notifications.show({ color: approved ? 'green' : 'red', message: approved ? 'Etapa aprovada!' : 'Etapa reprovada — fluxo encerrado.' });
      setComment('');
      await loadSteps();
      onChanged();
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao decidir etapa: ${err.message}` });
    }
    setBusy(false);
  }

  async function handleEmit() {
    setBusy(true);
    try {
      const newCode = await emitRevision({
        documentRevisionId: revision.id,
        projectDocumentId: projectDocument.id,
        currentCode: revision.revision_code,
        settings
      });
      notifications.show({ color: 'green', message: `Documento emitido como revisão ${newCode}!` });
      onChanged();
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao emitir documento: ${err.message}` });
    }
    setBusy(false);
  }

  async function handleFinalize() {
    setBusy(true);
    try {
      await finalizeRevision({
        documentRevisionId: revision.id,
        projectDocumentId: projectDocument.id,
        userId: user.id
      });
      notifications.show({ color: 'green', message: 'Documento finalizado — ciclo encerrado.' });
      onChanged();
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao finalizar documento: ${err.message}` });
    }
    setBusy(false);
  }

  if (loading) return null;

  const hasWorkflow = Boolean(project.workflow_template_id);
  const currentStep = steps.find((s) => s.status === 'pendente');
  const canDecideCurrent = currentStep && (currentStep.approver_user_id === user.id || isAdmin);
  const rejected = steps.some((s) => s.status === 'reprovado');

  return (
    <Stack gap="xs">
      {steps.length === 0 && (
        <Group justify="space-between">
          {hasWorkflow ? (
            <>
              <Text size="sm" c="dimmed">
                Esta revisão ainda não foi enviada para aprovação.
              </Text>
              <Button size="xs" leftSection={<IconSend size={14} />} loading={busy} onClick={handleSendForApproval}>
                Enviar para Aprovação
              </Button>
            </>
          ) : (
            <Alert color="gray" variant="light" w="100%">
              Nenhum fluxo de aprovação vinculado a este projeto. Você pode emitir diretamente ou vincular um fluxo nas
              configurações do projeto.
            </Alert>
          )}
        </Group>
      )}

      {steps.length > 0 && (
        <Stack gap={6}>
          {steps.map((s) => (
            <Paper key={s.id} withBorder p="xs" radius="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color={STATUS_COLORS[s.status]} variant="light">
                    {s.step_order}. {s.name}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {s.profiles?.full_name || 'Sem aprovador definido'}
                  </Text>
                </Group>
                <Badge color={STATUS_COLORS[s.status]}>{s.status}</Badge>
              </Group>
              {s.comment && (
                <Text size="xs" mt={4} c="dimmed">
                  "{s.comment}"
                </Text>
              )}
            </Paper>
          ))}

          {canDecideCurrent && (
            <Paper withBorder p="sm" radius="sm" bg="yellow.0">
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  É sua vez de decidir: {currentStep.name}
                </Text>
                <Textarea
                  placeholder="Comentário (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.currentTarget.value)}
                  minRows={1}
                  autosize
                />
                <Group>
                  <Button size="xs" color="green" leftSection={<IconCheck size={14} />} loading={busy} onClick={() => handleDecide(currentStep, true)}>
                    Aprovar
                  </Button>
                  <Button size="xs" color="red" leftSection={<IconX size={14} />} loading={busy} onClick={() => handleDecide(currentStep, false)}>
                    Reprovar
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {!rejected && (revision.status === 'aprovado' || (!hasWorkflow && revision.status !== 'emitido' && revision.status !== 'finalizado')) && (
        <Group justify="flex-end">
          <Button size="xs" color="brand" leftSection={<IconCertificate size={14} />} loading={busy} onClick={handleEmit}>
            Emitir Documento
          </Button>
        </Group>
      )}

      {revision.status === 'emitido' && (
        <Group justify="flex-end">
          <Button size="xs" color="dark" leftSection={<IconFlagFilled size={14} />} loading={busy} onClick={handleFinalize}>
            Finalizar Documento
          </Button>
        </Group>
      )}
    </Stack>
  );
}
