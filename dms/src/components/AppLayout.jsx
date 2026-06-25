import { AppShell, Group, Title, NavLink, Button, Text, Avatar, Stack, Divider, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFolders,
  IconFileText,
  IconUsers,
  IconAdjustments,
  IconLogout,
  IconChecklist,
  IconSitemap,
  IconFolderCog,
  IconFileStack,
  IconFileDescription,
  IconExternalLink,
  IconListCheck,
  IconHistory,
  IconBook2,
  IconSun,
  IconMoon
} from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../lib/roles';

function Item({ to, label, icon }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <NavLink
      component={RouterNavLink}
      to={to}
      label={label}
      leftSection={icon}
      active={active}
      variant="light"
      style={{ borderRadius: 10, fontWeight: active ? 600 : 500 }}
    />
  );
}

export function AppLayout() {
  const { profile, user, isAdmin, signOut } = useAuth();
  const roleText = roleLabel(profile?.role) || (isAdmin ? 'Administrador' : 'Membro');
  const navigate = useNavigate();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <AppShell padding="md" navbar={{ width: 272, breakpoint: 'sm' }} header={{ height: 64 }}>
      <AppShell.Header
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', backdropFilter: 'blur(6px)' }}
      >
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <ThemeIcon size={34} radius="md" variant="gradient" gradient={{ from: 'brand.6', to: 'brand.4', deg: 135 }}>
              <IconFileStack size={20} />
            </ThemeIcon>
            <Title order={4} fw={700} c="dark.6">
              Gestão de Documentos
            </Title>
          </Group>
          <Group gap="sm">
            <Tooltip label={isDark ? 'Modo claro' : 'Modo escuro'} withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                aria-label="Alternar tema"
              >
                {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>
            <Stack gap={0} align="flex-end">
              <Text size="sm" fw={600}>
                {profile?.full_name || user?.email}
              </Text>
              <Text size="xs" c="dimmed">
                {roleText}
              </Text>
            </Stack>
            <Avatar color="brand" radius="xl" variant="filled">
              {(profile?.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-2)' }}>
        <Stack gap="xs" justify="space-between" h="100%">
          <Stack gap={6}>
            <Item to="/dashboard" label="Dashboard" icon={<IconLayoutDashboard size={18} />} />
            <Item to="/projects" label="Projetos" icon={<IconFolders size={18} />} />
            <Item to="/approvals" label="Minhas Aprovações" icon={<IconChecklist size={18} />} />
            <Item to="/help" label="Documentação" icon={<IconBook2 size={18} />} />
            <NavLink
              component="a"
              href={import.meta.env.VITE_MEMORIAL_GENERATOR_URL || 'http://localhost:3000'}
              target="_blank"
              rel="noopener noreferrer"
              label="Memorial Descritivo"
              leftSection={<IconFileDescription size={18} />}
              rightSection={<IconExternalLink size={14} />}
              variant="light"
              style={{ borderRadius: 10, fontWeight: 500 }}
            />
            {isAdmin && (
              <>
                <Divider label="Administração" labelPosition="center" mt="lg" mb={2} c="dimmed" />
                <Item to="/admin/document-types" label="Tipos de Documento" icon={<IconFileText size={18} />} />
                <Item to="/admin/workflows" label="Fluxos de Aprovação" icon={<IconSitemap size={18} />} />
                <Item to="/admin/hierarchies" label="Hierarquias" icon={<IconUsers size={18} />} />
                <Item to="/admin/document-sets" label="Conjuntos de Documentos" icon={<IconFolderCog size={18} />} />
                <Item to="/admin/checklists" label="Checklists de Auditoria" icon={<IconListCheck size={18} />} />
                <Item to="/admin/audit-log" label="Log de Auditoria" icon={<IconHistory size={18} />} />
                <Item to="/admin/settings" label="Numeração de Revisão" icon={<IconAdjustments size={18} />} />
                <Item to="/admin/users" label="Usuários" icon={<IconUsers size={18} />} />
              </>
            )}
          </Stack>
          <Button variant="subtle" color="red" radius="md" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Sair
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
