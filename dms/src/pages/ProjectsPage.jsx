import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Button,
  Card,
  SimpleGrid,
  Text,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Stack,
  Group,
  Loader,
  Center,
  Badge,
  Divider
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

const EMPTY_FORM = {
  project_code: '',
  name: '',
  client_name: '',
  municipio: '',
  estado: '',
  endereco: '',
  area: '',
  potencia_instalada: '',
  workflow_template_id: '',
  hierarchy_template_id: '',
  document_set_template_id: ''
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);
  const [documentSets, setDocumentSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  async function loadAll() {
    setLoading(true);
    const [{ data: projectsData, error }, { data: workflowsData }, { data: hierarchiesData }, { data: setsData }] =
      await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('workflow_templates').select('id, name').order('name'),
        supabase.from('hierarchy_templates').select('id, name').order('name'),
        supabase.from('document_set_templates').select('id, name').order('name')
      ]);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar projetos: ${error.message}` });
    } else {
      setProjects(projectsData);
    }
    setWorkflows(workflowsData ?? []);
    setHierarchies(hierarchiesData ?? []);
    setDocumentSets(setsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      project_code: form.project_code || null,
      name: form.name,
      client_name: form.client_name || null,
      municipio: form.municipio || null,
      estado: form.estado || null,
      endereco: form.endereco || null,
      area: form.area === '' ? null : form.area,
      potencia_instalada: form.potencia_instalada === '' ? null : form.potencia_instalada,
      workflow_template_id: form.workflow_template_id || null,
      hierarchy_template_id: form.hierarchy_template_id || null,
      document_set_template_id: form.document_set_template_id || null,
      created_by: user.id
    });
    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao criar projeto: ${error.message}` });
      return;
    }

    notifications.show({ color: 'green', message: 'Projeto criado com sucesso!' });
    setModalOpen(false);
    setForm(EMPTY_FORM);
    loadAll();
  }

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchText = !q || p.name?.toLowerCase().includes(q) || p.project_code?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchText && matchStatus;
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Projetos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
          Novo Projeto
        </Button>
      </Group>

      <Group>
        <TextInput
          placeholder="Buscar por nome, código ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
          clearable
        />
        <Select
          placeholder="Todos os status"
          clearable
          data={[
            { value: 'ativo', label: 'Ativo' },
            { value: 'concluido', label: 'Concluído' },
            { value: 'suspenso', label: 'Suspenso' }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          w={180}
        />
      </Group>

      {loading ? (
        <Center mt="xl">
          <Loader />
        </Center>
      ) : filtered.length === 0 ? (
        <Text c="dimmed">{projects.length === 0 ? 'Nenhum projeto cadastrado ainda.' : 'Nenhum projeto encontrado para os filtros aplicados.'}</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="clickable-card"
              padding="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <Group justify="space-between" mb="xs">
                <Text fw={600}>{p.name}</Text>
                <Badge color="brand">{p.status}</Badge>
              </Group>
              {(p.project_code || p.client_name) && (
                <Text size="xs" c="dimmed" mb={4}>
                  {[p.project_code, p.client_name].filter(Boolean).join(' · ')}
                </Text>
              )}
              <Text size="sm" c="dimmed">
                {[p.municipio, p.estado].filter(Boolean).join(' - ') || 'Local não informado'}
              </Text>
              {p.potencia_instalada && (
                <Text size="sm" mt="xs">
                  Potência: {p.potencia_instalada} kW
                </Text>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Novo Projeto" centered>
        <form onSubmit={handleCreate}>
          <Stack>
            <Group grow>
              <TextInput
                label="Código do Projeto"
                placeholder="ex: SAE-XIQ-001"
                value={form.project_code}
                onChange={(e) => updateField('project_code', e.currentTarget.value)}
              />
              <TextInput
                label="Cliente"
                placeholder="ex: Ilumisol Energia Solar"
                value={form.client_name}
                onChange={(e) => updateField('client_name', e.currentTarget.value)}
              />
            </Group>
            <TextInput
              label="Nome do Empreendimento"
              placeholder="ex: SAE-B Xique Xique"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.currentTarget.value)}
            />
            <Group grow>
              <TextInput
                label="Município"
                value={form.municipio}
                onChange={(e) => updateField('municipio', e.currentTarget.value)}
              />
              <TextInput label="Estado" value={form.estado} onChange={(e) => updateField('estado', e.currentTarget.value)} />
            </Group>
            <TextInput label="Endereço" value={form.endereco} onChange={(e) => updateField('endereco', e.currentTarget.value)} />
            <Group grow>
              <NumberInput
                label="Área (hectares)"
                value={form.area}
                onChange={(v) => updateField('area', v)}
              />
              <NumberInput
                label="Potência Instalada (kW)"
                value={form.potencia_instalada}
                onChange={(v) => updateField('potencia_instalada', v)}
              />
            </Group>

            <Divider label="Padrões aplicados ao projeto (opcional)" labelPosition="center" mt="sm" />

            <Select
              label="Fluxo de aprovação"
              placeholder="Selecione um fluxo"
              clearable
              data={workflows.map((w) => ({ value: w.id, label: w.name }))}
              value={form.workflow_template_id}
              onChange={(v) => updateField('workflow_template_id', v)}
            />
            <Select
              label="Hierarquia"
              placeholder="Selecione uma hierarquia"
              clearable
              data={hierarchies.map((h) => ({ value: h.id, label: h.name }))}
              value={form.hierarchy_template_id}
              onChange={(v) => updateField('hierarchy_template_id', v)}
            />
            <Select
              label="Conjunto de documentos"
              placeholder="Selecione um conjunto"
              clearable
              data={documentSets.map((s) => ({ value: s.id, label: s.name }))}
              value={form.document_set_template_id}
              onChange={(v) => updateField('document_set_template_id', v)}
            />

            <Button type="submit" loading={saving} mt="sm">
              Criar Projeto
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
