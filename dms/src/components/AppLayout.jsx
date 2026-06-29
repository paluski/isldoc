import { useEffect, useState } from 'react';
import {
  AppShell,
  Group,
  Title,
  NavLink,
  Text,
  Avatar,
  Stack,
  Divider,
  ThemeIcon,
  ActionIcon,
  Tooltip,
  Burger,
  UnstyledButton,
  Menu,
  Badge,
  Box,
  ScrollArea,
  Kbd
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useHotkeys, useMediaQuery } from '@mantine/hooks';
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
  IconMoon,
  IconHome,
  IconSearch,
  IconUser,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconFolder,
  IconChevronDown
} from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../lib/roles';
import { supabase } from '../lib/supabaseClient';
import { getRecentProjects } from '../lib/recentProjects';
import { PageMetaProvider } from './layout/PageMetaContext';
import { AppBreadcrumbs } from './layout/Breadcrumbs';
import { GlobalSearch } from './layout/GlobalSearch';
import { NotificationsCenter } from './layout/NotificationsCenter';

function Item({ to, label, icon, collapsed, badge, onNavigate }) {
  const location = useLocation();
  const active = to === '/home' ? location.pathname === '/home' : location.pathname.startsWith(to);

  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        <NavLink
          component={RouterNavLink}
          to={to}
          active={active}
          leftSection={icon}
          variant="light"
          onClick={onNavigate}
          styles={{ section: { margin: 0 }, body: { display: 'none' } }}
          style={{ borderRadius: 10, justifyContent: 'center', padding: '10px 0' }}
        />
      </Tooltip>
    );
  }

  return (
    <NavLink
      component={RouterNavLink}
      to={to}
      label={label}
      leftSection={icon}
      rightSection={badge}
      active={active}
      variant="light"
      onClick={onNavigate}
      style={{ borderRadius: 10, fontWeight: active ? 600 : 500 }}
    />
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <Divider my={6} />;
  return (
    <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="md" mb={4} style={{ letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

export function AppLayout() {
  const { profile, user, isAdmin, signOut } = useAuth();
  const roleText = roleLabel(profile?.role) || (isAdmin ? 'Administrador' : 'Membro');
  const navigate = useNavigate();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [recent, setRecent] = useState(getRecentProjects());

  useHotkeys([['mod+K', () => setSearchOpen(true)]]);
  const desktopCollapsed = collapsed && !isMobile;

  useEffect(() => {
    function refresh() {
      setRecent(getRecentProjects());
    }
    window.addEventListener('dms:recent-projects-changed', refresh);
    return () => window.removeEventListener('dms:recent-projects-changed', refresh);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('revision_approval_steps')
      .select('id', { count: 'exact', head: true })
      .eq('approver_user_id', user.id)
      .eq('status', 'pendente')
      .then(({ count }) => setPendingApprovals(count ?? 0));
  }, [user?.id]);

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  const onNavigate = isMobile ? closeMobile : undefined;
  const navWidth = desktopCollapsed ? 84 : 274;
  const userName = profile?.full_name || user?.email || '?';

  return (
    <PageMetaProvider>
      <AppShell
        padding="lg"
        header={{ height: 64 }}
        navbar={{
          width: navWidth,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened, desktop: false }
        }}
      >
        <AppShell.Header
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)', backdropFilter: 'blur(6px)' }}
        >
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <ThemeIcon size={34} radius="md" variant="gradient" gradient={{ from: 'brand.6', to: 'brand.4', deg: 135 }}>
                <IconFileStack size={20} />
              </ThemeIcon>
              <Title order={4} fw={700} visibleFrom="xs">
                ISL<Text span c="brand.6" inherit>Doc</Text>
              </Title>
            </Group>

            <UnstyledButton
              onClick={() => setSearchOpen(true)}
              visibleFrom="sm"
              style={{
                flex: 1,
                maxWidth: 440,
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 10,
                padding: '7px 12px'
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" c="dimmed">
                  <IconSearch size={16} />
                  <Text size="sm">Buscar projetos, documentos, clientes...</Text>
                </Group>
                <Group gap={4} wrap="nowrap">
                  <Kbd size="xs">Ctrl</Kbd>
                  <Kbd size="xs">K</Kbd>
                </Group>
              </Group>
            </UnstyledButton>

            <Group gap="xs" wrap="nowrap">
              <ActionIcon variant="subtle" color="gray" size="lg" hiddenFrom="sm" onClick={() => setSearchOpen(true)} aria-label="Buscar">
                <IconSearch size={19} />
              </ActionIcon>
              <NotificationsCenter />
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

              <Menu position="bottom-end" width={220} shadow="lg" radius="md">
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="xs" wrap="nowrap">
                      <Avatar color="brand" radius="xl" variant="filled" size={34}>
                        {userName.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Stack gap={0} visibleFrom="md">
                        <Text size="sm" fw={600} lh={1.1} maw={140} truncate>
                          {userName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {roleText}
                        </Text>
                      </Stack>
                      <IconChevronDown size={14} visibleFrom="md" style={{ opacity: 0.6 }} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{userName}</Menu.Label>
                  <Menu.Item leftSection={<IconUser size={15} />} component={Link} to="/profile">
                    Meu perfil
                  </Menu.Item>
                  <Menu.Item leftSection={<IconBook2 size={15} />} component={Link} to="/help">
                    Documentação
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<IconLogout size={15} />} onClick={handleLogout}>
                    Sair
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="sm" style={{ borderRight: '1px solid var(--mantine-color-default-border)' }}>
          <AppShell.Section grow component={ScrollArea}>
            <Stack gap={4}>
              <Item to="/home" label="Início" icon={<IconHome size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
              <Item to="/dashboard" label="Dashboard" icon={<IconLayoutDashboard size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
              <Item to="/projects" label="Projetos" icon={<IconFolders size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
              <Item
                to="/approvals"
                label="Aprovações"
                icon={<IconChecklist size={18} />}
                collapsed={desktopCollapsed}
                onNavigate={onNavigate}
                badge={pendingApprovals > 0 ? <Badge size="sm" circle variant="filled" color="red">{pendingApprovals}</Badge> : null}
              />
              <Item to="/help" label="Documentação" icon={<IconBook2 size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />

              {recent.length > 0 && (
                <>
                  <SectionLabel collapsed={desktopCollapsed}>Projetos recentes</SectionLabel>
                  {recent.map((p) =>
                    desktopCollapsed ? (
                      <Tooltip key={p.id} label={p.name} position="right" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="lg"
                          mx="auto"
                          onClick={() => navigate(`/projects/${p.id}`)}
                        >
                          <IconFolder size={17} />
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <NavLink
                        key={p.id}
                        component={Link}
                        to={`/projects/${p.id}`}
                        label={p.name}
                        description={p.code || undefined}
                        leftSection={<IconFolder size={16} />}
                        onClick={onNavigate}
                        style={{ borderRadius: 10 }}
                      />
                    )
                  )}
                </>
              )}

              {isAdmin && (
                <>
                  <SectionLabel collapsed={desktopCollapsed}>Administração</SectionLabel>
                  <Item to="/admin/document-types" label="Tipos de Documento" icon={<IconFileText size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/workflows" label="Fluxos de Aprovação" icon={<IconSitemap size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/hierarchies" label="Hierarquias" icon={<IconUsers size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/document-sets" label="Conjuntos de Documentos" icon={<IconFolderCog size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/checklists" label="Checklists" icon={<IconListCheck size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/audit-log" label="Auditoria" icon={<IconHistory size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/settings" label="Numeração de Revisão" icon={<IconAdjustments size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                  <Item to="/admin/users" label="Usuários" icon={<IconUser size={18} />} collapsed={desktopCollapsed} onNavigate={onNavigate} />
                </>
              )}

              <SectionLabel collapsed={desktopCollapsed}>Ferramentas</SectionLabel>
              {desktopCollapsed ? (
                <Tooltip label="Memorial Descritivo" position="right" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    mx="auto"
                    component="a"
                    href={import.meta.env.VITE_MEMORIAL_GENERATOR_URL || 'http://localhost:3000'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconFileDescription size={17} />
                  </ActionIcon>
                </Tooltip>
              ) : (
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
              )}
            </Stack>
          </AppShell.Section>

          <AppShell.Section>
            <Divider mb="xs" />
            <Group justify={desktopCollapsed ? 'center' : 'space-between'}>
              {!desktopCollapsed && (
                <Text size="xs" c="dimmed">
                  ISLDoc · GED
                </Text>
              )}
              <Tooltip label={desktopCollapsed ? 'Expandir menu' : 'Recolher menu'} withArrow position="right">
                <ActionIcon variant="subtle" color="gray" visibleFrom="sm" onClick={() => setCollapsed((c) => !c)}>
                  {desktopCollapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Box mb="md" px={2}>
            <AppBreadcrumbs />
          </Box>
          <Outlet />
        </AppShell.Main>
      </AppShell>

      <GlobalSearch opened={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageMetaProvider>
  );
}
