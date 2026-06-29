import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  ThemeIcon,
  Card,
  Badge,
  Loader,
  Center,
  Timeline,
  Button,
  Box,
  Anchor
} from '@mantine/core';
import {
  IconClipboardCheck,
  IconFileText,
  IconAlertTriangle,
  IconCalendarDue,
  IconArrowRight,
  IconFolders,
  IconLayoutDashboard,
  IconHistory,
  IconCircleCheck,
  IconUpload
} from '@tabler/icons-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(profile, user) {
  const full = profile?.full_name || user?.email || '';
  return full.split(/[\s@]/)[0] || 'usuário';
}

function TaskCard({ icon, color, count, label, to, onClick }) {
  const empty = count === 0;
  return (
    <Card
      withBorder
      padding="lg"
      className={empty ? undefined : 'clickable-card'}
      style={{ cursor: empty ? 'default' : 'pointer', opacity: empty ? 0.65 : 1 }}
      onClick={empty ? undefined : onClick}
      component={empty ? 'div' : Link}
      to={empty ? undefined : to}
    >
      <Group justify="space-between" align="flex-start">
        <ThemeIcon variant="light" color={empty ? 'gray' : color} size={46} radius="md">
          {icon}
        </ThemeIcon>
        <Text fw={800} size="34px" lh={1} c={empty ? 'dimmed' : undefined}>
          {count}
        </Text>
      </Group>
      <Text mt="md" fw={600} size="sm">
        {label}
      </Text>
      {!empty && (
        <Group gap={4} mt={4} c={`${color}.7`}>
          <Text size="xs" fw={500}>
            Ver agora
          </Text>
          <IconArrowRight size={13} />
        </Group>
      )}
    </Card>
  );
}

export function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ approvals: 0, myDocs: 0, ncs: 0, dueToday: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function load() {
    setLoading(true);
    const todayIso = new Date().toISOString().slice(0, 10);

    const [
      { count: approvalsCount },
      { count: myDocsCount },
      { data: ncData },
      { data: recentRevs }
    ] = await Promise.all([
      supabase
        .from('revision_approval_steps')
        .select('id', { count: 'exact', head: true })
        .eq('approver_user_id', user.id)
        .eq('status', 'pendente'),
      supabase
        .from('project_documents')
        .select('id', { count: 'exact', head: true })
        .eq('responsible_user_id', user.id)
        .neq('status', 'emitido'),
      supabase
        .from('non_conformities')
        .select('id, due_date, status')
        .eq('responsible_user_id', user.id)
        .neq('status', 'encerrada'),
      supabase
        .from('document_revisions')
        .select('id, revision_code, file_name, status, uploaded_at, project_documents!document_revisions_project_document_id_fkey(project_id, nome_padrao_arquivo, projects(name))')
        .order('uploaded_at', { ascending: false })
        .limit(6)
    ]);

    const ncs = ncData ?? [];
    const dueToday = ncs.filter((n) => n.due_date && n.due_date <= todayIso).length;

    setCounts({
      approvals: approvalsCount ?? 0,
      myDocs: myDocsCount ?? 0,
      ncs: ncs.length,
      dueToday
    });
    setActivity(recentRevs ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  const totalTasks = counts.approvals + counts.myDocs + counts.ncs;

  return (
    <Stack gap="xl">
      <Box>
        <Title order={2} fw={700}>
          {greeting()}, {firstName(profile, user)} 👋
        </Title>
        <Text c="dimmed" mt={4}>
          {totalTasks === 0
            ? 'Você está em dia. Nenhuma tarefa pendente exige sua atenção agora.'
            : `Hoje você tem ${totalTasks} item${totalTasks > 1 ? 's' : ''} aguardando sua atenção.`}
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <TaskCard
          icon={<IconClipboardCheck size={24} />}
          color="yellow"
          count={counts.approvals}
          label="Aprovações aguardando você"
          to="/approvals"
          onClick={() => navigate('/approvals')}
        />
        <TaskCard
          icon={<IconFileText size={24} />}
          color="blue"
          count={counts.myDocs}
          label="Documentos sob sua responsabilidade"
          to="/projects"
          onClick={() => navigate('/projects')}
        />
        <TaskCard
          icon={<IconAlertTriangle size={24} />}
          color="orange"
          count={counts.ncs}
          label="Não conformidades atribuídas a você"
          to="/projects"
          onClick={() => navigate('/projects')}
        />
        <TaskCard
          icon={<IconCalendarDue size={24} />}
          color="red"
          count={counts.dueToday}
          label="Prazos vencendo (hoje ou atrasados)"
          to="/projects"
          onClick={() => navigate('/projects')}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        <Paper withBorder p="lg" radius="lg" style={{ gridColumn: 'span 1' }}>
          <Text fw={600} mb="md">
            Acesso rápido
          </Text>
          <Stack gap="sm">
            <Button
              variant="light"
              justify="flex-start"
              leftSection={<IconLayoutDashboard size={18} />}
              component={Link}
              to="/dashboard"
              fullWidth
            >
              Painel executivo
            </Button>
            <Button
              variant="light"
              color="grape"
              justify="flex-start"
              leftSection={<IconFolders size={18} />}
              component={Link}
              to="/projects"
              fullWidth
            >
              Meus projetos
            </Button>
            <Button
              variant="light"
              color="yellow"
              justify="flex-start"
              leftSection={<IconClipboardCheck size={18} />}
              component={Link}
              to="/approvals"
              fullWidth
            >
              Fila de aprovações
            </Button>
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="lg" style={{ gridColumn: 'span 2' }}>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon variant="light" color="gray" size="sm" radius="sm">
                <IconHistory size={14} />
              </ThemeIcon>
              <Text fw={600}>Atividade recente</Text>
            </Group>
            <Anchor component={Link} to="/projects" size="xs">
              Ver projetos
            </Anchor>
          </Group>
          {activity.length === 0 ? (
            <Text size="sm" c="dimmed">
              Nenhuma atividade documental registrada ainda.
            </Text>
          ) : (
            <Timeline active={activity.length} bulletSize={22} lineWidth={2}>
              {activity.map((rev) => {
                const doc = rev.project_documents;
                const emitted = rev.status === 'aprovado' || rev.is_emission;
                return (
                  <Timeline.Item
                    key={rev.id}
                    bullet={emitted ? <IconCircleCheck size={13} /> : <IconUpload size={13} />}
                    color={rev.status === 'reprovado' ? 'red' : emitted ? 'green' : 'brand'}
                    title={
                      <Group gap={6}>
                        <Text size="sm" fw={500} component={Link} to={`/projects/${doc?.project_id}`}>
                          {doc?.nome_padrao_arquivo || rev.file_name}
                        </Text>
                        <Badge size="xs" variant="light">
                          {rev.revision_code}
                        </Badge>
                      </Group>
                    }
                  >
                    <Text size="xs" c="dimmed">
                      {doc?.projects?.name} · {statusLabel(rev.status)} ·{' '}
                      {new Date(rev.uploaded_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          )}
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}

function statusLabel(status) {
  return (
    {
      rascunho: 'Rascunho',
      em_analise: 'Em análise',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado'
    }[status] || status
  );
}
