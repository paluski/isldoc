import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text, Group } from '@mantine/core';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { usePageMeta } from './PageMetaContext';

// Mapa estático segmento -> rótulo. Segmentos dinâmicos (ids) são resolvidos
// via PageMetaContext quando a página os registra.
const STATIC_LABELS = {
  home: 'Início',
  dashboard: 'Dashboard',
  projects: 'Projetos',
  approvals: 'Aprovações',
  help: 'Documentação',
  profile: 'Perfil',
  admin: 'Administração',
  'document-types': 'Tipos de Documento',
  workflows: 'Fluxos de Aprovação',
  hierarchies: 'Hierarquias',
  'document-sets': 'Conjuntos de Documentos',
  checklists: 'Checklists',
  'audit-log': 'Auditoria',
  settings: 'Numeração de Revisão',
  users: 'Usuários'
};

export function AppBreadcrumbs() {
  const location = useLocation();
  const { labels } = usePageMeta();

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const to = '/' + segments.slice(0, index + 1).join('/');
    const label = labels[segment] || STATIC_LABELS[segment] || segment;
    return { to, label, isLast: index === segments.length - 1 };
  });

  return (
    <MantineBreadcrumbs
      separator={<IconChevronRight size={14} style={{ opacity: 0.5 }} />}
      separatorMargin={6}
    >
      <Anchor component={Link} to="/home" c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
        <IconHome size={15} />
      </Anchor>
      {crumbs.map((crumb) =>
        crumb.isLast ? (
          <Group key={crumb.to} gap={4} wrap="nowrap">
            <Text size="sm" fw={600}>
              {crumb.label}
            </Text>
          </Group>
        ) : (
          <Anchor key={crumb.to} component={Link} to={crumb.to} c="dimmed" size="sm">
            {crumb.label}
          </Anchor>
        )
      )}
    </MantineBreadcrumbs>
  );
}
