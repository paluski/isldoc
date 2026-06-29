import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  TextInput,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Loader,
  UnstyledButton,
  Divider,
  Kbd,
  Box
} from '@mantine/core';
import { IconSearch, IconFolder, IconFileText, IconCornerDownLeft } from '@tabler/icons-react';
import { supabase } from '../../lib/supabaseClient';

function ResultRow({ icon, color, title, subtitle, onClick }) {
  return (
    <UnstyledButton
      onClick={onClick}
      p="xs"
      style={{ borderRadius: 10, display: 'block', width: '100%' }}
      className="clickable-card"
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} radius="md" size={34}>
          {icon}
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {title}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed" truncate>
              {subtitle}
            </Text>
          )}
        </div>
      </Group>
    </UnstyledButton>
  );
}

export function GlobalSearch({ opened, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!opened) {
      setQuery('');
      setProjects([]);
      setDocuments([]);
    }
  }, [opened]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setProjects([]);
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const like = `%${q}%`;
      const [{ data: projectsData }, { data: docsData }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, project_code, client_name, status')
          .or(`name.ilike.${like},project_code.ilike.${like},client_name.ilike.${like}`)
          .limit(6),
        supabase
          .from('project_documents')
          .select('id, project_id, nome_padrao_arquivo, document_types(name), projects(name)')
          .ilike('nome_padrao_arquivo', like)
          .limit(6)
      ]);
      setProjects(projectsData ?? []);
      setDocuments(docsData ?? []);
      setLoading(false);
    }, 220);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  function go(path) {
    onClose();
    navigate(path);
  }

  const hasResults = projects.length > 0 || documents.length > 0;
  const showEmpty = query.trim().length >= 2 && !loading && !hasResults;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="lg"
      padding={0}
      radius="lg"
      yOffset="12vh"
    >
      <Box p="md" pb="xs">
        <TextInput
          data-autofocus
          size="md"
          variant="unstyled"
          placeholder="Buscar projetos, documentos, clientes, códigos..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leftSection={loading ? <Loader size="xs" /> : <IconSearch size={18} />}
        />
      </Box>
      <Divider />
      <Box p="sm" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
        {query.trim().length < 2 && (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            Digite ao menos 2 caracteres para buscar.
          </Text>
        )}
        {showEmpty && (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            Nenhum resultado para “{query.trim()}”.
          </Text>
        )}
        <Stack gap={2}>
          {projects.length > 0 && (
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="xs" pt="xs">
              Projetos
            </Text>
          )}
          {projects.map((p) => (
            <ResultRow
              key={p.id}
              icon={<IconFolder size={18} />}
              color="brand"
              title={p.name}
              subtitle={[p.project_code, p.client_name].filter(Boolean).join(' · ') || 'Sem cliente'}
              onClick={() => go(`/projects/${p.id}`)}
            />
          ))}
          {documents.length > 0 && (
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="xs" pt="xs">
              Documentos
            </Text>
          )}
          {documents.map((d) => (
            <ResultRow
              key={d.id}
              icon={<IconFileText size={18} />}
              color="blue"
              title={d.nome_padrao_arquivo}
              subtitle={[d.document_types?.name, d.projects?.name].filter(Boolean).join(' · ')}
              onClick={() => go(`/projects/${d.project_id}`)}
            />
          ))}
        </Stack>
      </Box>
      <Divider />
      <Group justify="space-between" px="md" py="xs" c="dimmed">
        <Group gap={6}>
          <IconCornerDownLeft size={13} />
          <Text size="xs">para abrir</Text>
        </Group>
        <Group gap={6}>
          <Kbd size="xs">Esc</Kbd>
          <Text size="xs">para fechar</Text>
        </Group>
      </Group>
    </Modal>
  );
}
