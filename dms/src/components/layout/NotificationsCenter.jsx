import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Indicator,
  ActionIcon,
  Popover,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Divider,
  UnstyledButton,
  ScrollArea,
  Tooltip,
  Badge
} from '@mantine/core';
import {
  IconBell,
  IconClipboardCheck,
  IconAlertTriangle,
  IconCalendarDue
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

function NotifRow({ icon, color, title, subtitle, badge, onClick }) {
  return (
    <UnstyledButton onClick={onClick} p="xs" style={{ borderRadius: 8, width: '100%' }} className="clickable-card">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" color={color} radius="md" size={32}>
          {icon}
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {title}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {subtitle}
            </Text>
          )}
        </div>
        {badge}
      </Group>
    </UnstyledButton>
  );
}

export function NotificationsCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [ncs, setNcs] = useState([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const [{ data: approvalsData }, { data: ncData }] = await Promise.all([
      supabase
        .from('revision_approval_steps')
        .select('id, name, step_order, document_revisions(revision_code, project_documents!document_revisions_project_document_id_fkey(project_id, nome_padrao_arquivo, projects(name)))')
        .eq('approver_user_id', user.id)
        .eq('status', 'pendente')
        .order('created_at')
        .limit(10),
      supabase
        .from('non_conformities')
        .select('id, title, severity, due_date, project_id, projects(name)')
        .eq('responsible_user_id', user.id)
        .neq('status', 'encerrada')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(10)
    ]);
    setApprovals(approvalsData ?? []);
    setNcs((ncData ?? []).map((n) => ({ ...n, overdue: n.due_date && n.due_date <= todayIso })));
  }, [user?.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 120000);
    return () => clearInterval(interval);
  }, [load]);

  const total = approvals.length + ncs.length;

  function go(path) {
    setOpened(false);
    navigate(path);
  }

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" width={360} shadow="lg" radius="lg" withArrow>
      <Popover.Target>
        <Indicator disabled={total === 0} label={total > 9 ? '9+' : total} size={16} color="red" offset={5}>
          <Tooltip label="Notificações" withArrow>
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setOpened((o) => !o)} aria-label="Notificações">
              <IconBell size={19} />
            </ActionIcon>
          </Tooltip>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" px="md" py="sm">
          <Text fw={600}>Notificações</Text>
          {total > 0 && (
            <Badge variant="light" color="red" size="sm">
              {total} pendente{total > 1 ? 's' : ''}
            </Badge>
          )}
        </Group>
        <Divider />
        <ScrollArea.Autosize mah={400}>
          <Stack gap={2} p="xs">
            {total === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="lg">
                Tudo em dia. Nenhuma pendência para você.
              </Text>
            )}
            {approvals.map((a) => {
              const doc = a.document_revisions?.project_documents;
              return (
                <NotifRow
                  key={a.id}
                  icon={<IconClipboardCheck size={17} />}
                  color="yellow"
                  title={`Aprovação: ${doc?.nome_padrao_arquivo || 'documento'}`}
                  subtitle={`${doc?.projects?.name || ''} · Etapa ${a.step_order}: ${a.name}`}
                  onClick={() => go('/approvals')}
                />
              );
            })}
            {ncs.map((n) => (
              <NotifRow
                key={n.id}
                icon={n.overdue ? <IconCalendarDue size={17} /> : <IconAlertTriangle size={17} />}
                color={n.overdue ? 'red' : 'orange'}
                title={n.title}
                subtitle={`${n.projects?.name || ''}${n.due_date ? ` · vence ${n.due_date}` : ''}`}
                badge={n.overdue ? <Badge color="red" size="xs" variant="filled">Atrasada</Badge> : null}
                onClick={() => go(`/projects/${n.project_id}`)}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
