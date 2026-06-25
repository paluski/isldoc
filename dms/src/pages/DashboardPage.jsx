import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Title,
  Stack,
  SimpleGrid,
  Paper,
  Text,
  Group,
  RingProgress,
  Center,
  Loader,
  Table,
  Badge,
  Anchor,
  Select,
  Button,
  ThemeIcon
} from '@mantine/core';
import {
  IconFolders,
  IconFileText,
  IconClipboardCheck,
  IconAlertTriangle
} from '@tabler/icons-react';
import { supabase } from '../lib/supabaseClient';
import { computeApplicabilityGaps } from '../lib/applicability';

function StatCard({ icon, label, value, color }) {
  return (
    <Paper withBorder p="md" radius="lg">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            {label}
          </Text>
          <Text size="28px" fw={700} mt={2}>
            {value}
          </Text>
        </div>
        <ThemeIcon size={44} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

const PAGE_SIZE = 5;

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [byResponsible, setByResponsible] = useState([]);
  const [byClient, setByClient] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [showAllResponsible, setShowAllResponsible] = useState(false);
  const [showAllClients, setShowAllClients] = useState(false);

  useEffect(() => {
    load();
  }, [dateRange]);

  async function load() {
    setLoading(true);

    const sinceDate = dateRange === '30d'
      ? new Date(Date.now() - 30 * 86400000).toISOString()
      : dateRange === '90d'
      ? new Date(Date.now() - 90 * 86400000).toISOString()
      : null;

    const withDate = (q) => sinceDate ? q.gte('created_at', sinceDate) : q;

    const [
      { data: projects },
      { data: projectDocuments },
      { data: approvalSteps },
      { data: revisions },
      { data: nonConformities }
    ] = await Promise.all([
      supabase.from('projects').select('id, status, client_name, document_set_template_id'),
      withDate(supabase.from('project_documents').select('id, project_id, document_type_id, status, responsible_user_id, profiles(full_name)')),
      withDate(supabase.from('revision_approval_steps').select('id, status')),
      withDate(supabase.from('document_revisions').select('id, status')),
      withDate(supabase.from('non_conformities').select('id, status'))
    ]);

    const projectsAtivos = (projects ?? []).filter((p) => p.status === 'ativo').length;
    const projectsConcluidos = (projects ?? []).filter((p) => p.status === 'concluido').length;

    const docsTotal = projectDocuments?.length ?? 0;
    const docsEmitidos = (projectDocuments ?? []).filter((d) => d.status === 'emitido').length;
    const docsPendentes = (projectDocuments ?? []).filter((d) => d.status === 'pendente').length;

    const aprovacoesPendentes = (approvalSteps ?? []).filter((s) => s.status === 'pendente').length;
    const reprovacoes = (revisions ?? []).filter((r) => r.status === 'reprovado').length;
    const ncsAbertas = (nonConformities ?? []).filter((n) => n.status !== 'encerrada').length;

    const templateIds = [...new Set((projects ?? []).map((p) => p.document_set_template_id).filter(Boolean))];
    let projetosComPendencia = 0;
    if (templateIds.length > 0) {
      const { data: setItems } = await supabase
        .from('document_set_template_items')
        .select('document_set_template_id, document_type_id')
        .in('document_set_template_id', templateIds);

      const itemsByTemplate = new Map();
      (setItems ?? []).forEach((it) => {
        if (!itemsByTemplate.has(it.document_set_template_id)) itemsByTemplate.set(it.document_set_template_id, []);
        itemsByTemplate.get(it.document_set_template_id).push(it);
      });

      projetosComPendencia = (projects ?? []).filter((p) => {
        if (!p.document_set_template_id) return false;
        const required = itemsByTemplate.get(p.document_set_template_id) ?? [];
        const linked = (projectDocuments ?? []).filter((d) => d.project_id === p.id);
        return computeApplicabilityGaps(required, linked).gapCount > 0;
      }).length;
    }

    const conformidade = docsTotal > 0 ? Math.round((docsEmitidos / docsTotal) * 100) : 0;

    const responsibleMap = new Map();
    (projectDocuments ?? []).forEach((d) => {
      const key = d.responsible_user_id || 'sem_responsavel';
      const label = d.profiles?.full_name || (d.responsible_user_id ? d.responsible_user_id : 'Sem responsável');
      if (!responsibleMap.has(key)) {
        responsibleMap.set(key, { label, pendente: 0, em_revisao: 0, emitido: 0, total: 0 });
      }
      const entry = responsibleMap.get(key);
      entry.total += 1;
      if (d.status === 'pendente') entry.pendente += 1;
      else if (d.status === 'emitido') entry.emitido += 1;
      else entry.em_revisao += 1;
    });

    const clientMap = new Map();
    (projects ?? []).forEach((p) => {
      const key = p.client_name || 'Sem cliente definido';
      if (!clientMap.has(key)) {
        clientMap.set(key, { label: key, ativo: 0, concluido: 0, total: 0 });
      }
      const entry = clientMap.get(key);
      entry.total += 1;
      if (p.status === 'ativo') entry.ativo += 1;
      else if (p.status === 'concluido') entry.concluido += 1;
    });

    setStats({
      totalProjetos: projects?.length ?? 0,
      projectsAtivos,
      projectsConcluidos,
      projetosComPendencia,
      docsTotal,
      docsEmitidos,
      docsPendentes,
      aprovacoesPendentes,
      reprovacoes,
      ncsAbertas,
      conformidade
    });
    setByResponsible(Array.from(responsibleMap.values()).sort((a, b) => b.total - a.total));
    setByClient(Array.from(clientMap.values()).sort((a, b) => b.total - a.total));
    setLoading(false);
  }

  if (loading || !stats) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  const visibleResponsible = showAllResponsible ? byResponsible : byResponsible.slice(0, PAGE_SIZE);
  const visibleClients = showAllClients ? byClient : byClient.slice(0, PAGE_SIZE);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Select
          w={160}
          size="xs"
          data={[
            { value: 'all', label: 'Todo o período' },
            { value: '90d', label: 'Últimos 90 dias' },
            { value: '30d', label: 'Últimos 30 dias' }
          ]}
          value={dateRange}
          onChange={(v) => setDateRange(v ?? 'all')}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
        <StatCard
          icon={<IconFolders size={22} color="var(--mantine-color-brand-6)" />}
          label="Projetos Ativos"
          value={stats.projectsAtivos}
          color="brand"
        />
        <StatCard
          icon={<IconFileText size={22} color="var(--mantine-color-blue-6)" />}
          label="Documentos Pendentes"
          value={stats.docsPendentes}
          color="blue"
        />
        <StatCard
          icon={<IconClipboardCheck size={22} color="var(--mantine-color-yellow-7)" />}
          label="Aprovações Pendentes"
          value={stats.aprovacoesPendentes}
          color="yellow"
        />
        <StatCard
          icon={<IconAlertTriangle size={22} color="var(--mantine-color-red-6)" />}
          label="Revisões Reprovadas"
          value={stats.reprovacoes}
          color="red"
        />
        <StatCard
          icon={<IconAlertTriangle size={22} color="var(--mantine-color-orange-6)" />}
          label="Não Conformidades Abertas"
          value={stats.ncsAbertas}
          color="orange"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        <Paper withBorder p="md" radius="lg">
          <Group justify="space-between">
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                Taxa de Conformidade
              </Text>
              <Text size="xs" c="dimmed">
                Documentos emitidos / total vinculado
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                {stats.docsEmitidos} de {stats.docsTotal} documentos
              </Text>
            </Stack>
            <RingProgress
              size={90}
              thickness={9}
              roundCaps
              sections={[{ value: stats.conformidade, color: stats.conformidade >= 70 ? 'green' : stats.conformidade >= 40 ? 'yellow' : 'red' }]}
              label={
                <Text ta="center" fw={700} size="lg">
                  {stats.conformidade}%
                </Text>
              }
            />
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="lg">
          <Text size="sm" fw={600} mb="xs">
            Projetos
          </Text>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Total
            </Text>
            <Text fw={600}>{stats.totalProjetos}</Text>
          </Group>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Ativos
            </Text>
            <Text fw={600}>{stats.projectsAtivos}</Text>
          </Group>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Concluídos
            </Text>
            <Text fw={600}>{stats.projectsConcluidos}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Com pendências documentais
            </Text>
            <Text fw={600} c={stats.projetosComPendencia > 0 ? 'red' : undefined}>
              {stats.projetosComPendencia}
            </Text>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="lg">
          <Text size="sm" fw={600} mb="xs">
            Documentos
          </Text>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Total vinculado
            </Text>
            <Text fw={600}>{stats.docsTotal}</Text>
          </Group>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Emitidos
            </Text>
            <Text fw={600}>{stats.docsEmitidos}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Pendentes
            </Text>
            <Text fw={600}>{stats.docsPendentes}</Text>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="md" radius="lg">
        <Text size="sm" fw={600} mb="sm">
          Indicadores por Responsável
        </Text>
        {byResponsible.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nenhum documento com responsável atribuído ainda.
          </Text>
        ) : (
          <>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Responsável</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Pendentes</Table.Th>
                  <Table.Th>Em revisão/análise</Table.Th>
                  <Table.Th>Emitidos</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleResponsible.map((r) => (
                  <Table.Tr key={r.label}>
                    <Table.Td>{r.label}</Table.Td>
                    <Table.Td>{r.total}</Table.Td>
                    <Table.Td>
                      <Badge color="gray" variant="light">
                        {r.pendente}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="yellow" variant="light">
                        {r.em_revisao}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">
                        {r.emitido}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {byResponsible.length > PAGE_SIZE && (
              <Button size="xs" variant="subtle" mt="xs" onClick={() => setShowAllResponsible((v) => !v)}>
                {showAllResponsible ? 'Ver menos' : `Ver mais (${byResponsible.length - PAGE_SIZE} ocultos)`}
              </Button>
            )}
          </>
        )}
      </Paper>

      <Paper withBorder p="md" radius="lg">
        <Text size="sm" fw={600} mb="sm">
          Indicadores por Cliente
        </Text>
        {byClient.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nenhum projeto com cliente definido ainda.
          </Text>
        ) : (
          <>
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th>Total de Projetos</Table.Th>
                  <Table.Th>Ativos</Table.Th>
                  <Table.Th>Concluídos</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleClients.map((c) => (
                  <Table.Tr key={c.label}>
                    <Table.Td>{c.label}</Table.Td>
                    <Table.Td>{c.total}</Table.Td>
                    <Table.Td>
                      <Badge color="brand" variant="light">
                        {c.ativo}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light">
                        {c.concluido}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {byClient.length > PAGE_SIZE && (
              <Button size="xs" variant="subtle" mt="xs" onClick={() => setShowAllClients((v) => !v)}>
                {showAllClients ? 'Ver menos' : `Ver mais (${byClient.length - PAGE_SIZE} ocultos)`}
              </Button>
            )}
          </>
        )}
      </Paper>

      <Text size="xs" c="dimmed">
        Veja a lista completa de projetos em <Anchor component={Link} to="/projects">Projetos</Anchor>.
      </Text>
    </Stack>
  );
}
