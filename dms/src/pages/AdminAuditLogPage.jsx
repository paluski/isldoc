import { useEffect, useState, Fragment } from 'react';
import { Title, Stack, Table, Badge, Select, Group, Text, Loader, Center, Code, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';

const ACTION_COLORS = { insert: 'green', update: 'yellow', delete: 'red' };

const TABLE_OPTIONS = [
  { value: '', label: 'Todas as tabelas' },
  { value: 'projects', label: 'Projetos' },
  { value: 'project_documents', label: 'Documentos do Projeto' },
  { value: 'document_revisions', label: 'Revisões' },
  { value: 'profiles', label: 'Usuários' },
  { value: 'non_conformities', label: 'Não Conformidades' }
];

function diffFields(oldData, newData) {
  if (!oldData || !newData) return [];
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const changes = [];
  keys.forEach((key) => {
    const before = oldData[key];
    const after = newData[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ key, before, after });
    }
  });
  return changes;
}

export function AdminAuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [profilesMap, setProfilesMap] = useState({});

  async function load() {
    setLoading(true);
    let query = supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(200);
    if (tableFilter) query = query.eq('table_name', tableFilter);

    const { data, error } = await query;
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar log de auditoria: ${error.message}` });
      setLoading(false);
      return;
    }

    const userIds = [...new Set((data ?? []).map((e) => e.changed_by).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      setProfilesMap(Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])));
    }

    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableFilter]);

  if (loading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Log de Auditoria</Title>
        <Select data={TABLE_OPTIONS} value={tableFilter} onChange={setTableFilter} w={260} />
      </Group>
      <Text size="sm" c="dimmed">
        Últimas {entries.length} alterações registradas automaticamente pelo banco. Apenas administradores têm acesso.
      </Text>

      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th>Tabela</Table.Th>
            <Table.Th>Ação</Table.Th>
            <Table.Th>Quem</Table.Th>
            <Table.Th>Quando</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map((entry) => {
            const changes = diffFields(entry.old_data, entry.new_data);
            const expanded = expandedId === entry.id;
            return (
              <Fragment key={entry.id}>
                <Table.Tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                  <Table.Td>
                    <ActionIcon variant="subtle" size="sm">
                      {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </ActionIcon>
                  </Table.Td>
                  <Table.Td>{entry.table_name}</Table.Td>
                  <Table.Td>
                    <Badge color={ACTION_COLORS[entry.action]} size="sm">
                      {entry.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{profilesMap[entry.changed_by] || '—'}</Table.Td>
                  <Table.Td>{new Date(entry.changed_at).toLocaleString('pt-BR')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td colSpan={5} p={0}>
                    <Collapse in={expanded}>
                      <div style={{ padding: '8px 16px', background: 'var(--mantine-color-gray-0)' }}>
                        {entry.action === 'update' && changes.length > 0 ? (
                          <Stack gap={4}>
                            {changes.map((c) => (
                              <Text size="xs" key={c.key}>
                                <strong>{c.key}</strong>: {JSON.stringify(c.before)} → {JSON.stringify(c.after)}
                              </Text>
                            ))}
                          </Stack>
                        ) : (
                          <Code block fz="xs">
                            {JSON.stringify(entry.action === 'delete' ? entry.old_data : entry.new_data, null, 2)}
                          </Code>
                        )}
                      </div>
                    </Collapse>
                  </Table.Td>
                </Table.Tr>
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
