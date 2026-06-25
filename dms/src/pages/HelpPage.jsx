import { useState } from 'react';
import {
  Title,
  Stack,
  Paper,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Divider,
  Box,
  Anchor,
  List,
  Table,
  Tabs,
  Alert,
  Code,
  SimpleGrid,
  Timeline,
  rem
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFolders,
  IconFileText,
  IconChecklist,
  IconUsers,
  IconSitemap,
  IconAlertTriangle,
  IconHistory,
  IconFileDescription,
  IconInfoCircle,
  IconBook2,
  IconRocket,
  IconShieldCheck,
  IconFileExport,
  IconSettings,
  IconChevronRight,
  IconCertificate,
  IconUserCheck,
  IconListCheck,
  IconFileStack,
  IconArrowRight,
  IconBulb,
  IconCircleCheck,
  IconEdit,
  IconEye,
  IconUpload,
  IconSend,
  IconStarFilled,
  IconFolderCog,
  IconAdjustments
} from '@tabler/icons-react';

const SECTIONS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: <IconBook2 size={15} /> },
  { id: 'primeiros-passos', label: 'Primeiros Passos', icon: <IconRocket size={15} /> },
  { id: 'perfis-acesso', label: 'Perfis de Acesso', icon: <IconShieldCheck size={15} /> },
  { id: 'projetos', label: 'Projetos', icon: <IconFolders size={15} /> },
  { id: 'documentos', label: 'Documentos e Revisões', icon: <IconFileText size={15} /> },
  { id: 'aprovacoes', label: 'Fluxos de Aprovação', icon: <IconSitemap size={15} /> },
  { id: 'qualidade', label: 'Qualidade e Auditoria', icon: <IconChecklist size={15} /> },
  { id: 'relatorios', label: 'Relatórios e Exportação', icon: <IconFileExport size={15} /> },
  { id: 'administracao', label: 'Administração', icon: <IconSettings size={15} /> },
  { id: 'memorial', label: 'Memorial Descritivo', icon: <IconFileDescription size={15} /> },
];

function SectionTitle({ id, icon, children }) {
  return (
    <Group gap="sm" mb="md" id={id} style={{ scrollMarginTop: 80 }}>
      <ThemeIcon size={32} radius="md" variant="gradient" gradient={{ from: 'brand.6', to: 'brand.4', deg: 135 }}>
        {icon}
      </ThemeIcon>
      <Title order={3} fw={700}>{children}</Title>
    </Group>
  );
}

function StepCard({ step, title, children }) {
  return (
    <Paper withBorder p="md" radius="lg">
      <Group align="flex-start" gap="sm">
        <ThemeIcon size={28} radius="xl" color="brand" variant="filled">
          <Text size="xs" fw={700} c="white">{step}</Text>
        </ThemeIcon>
        <Box flex={1}>
          <Text fw={600} mb={4}>{title}</Text>
          <Text size="sm" c="dimmed">{children}</Text>
        </Box>
      </Group>
    </Paper>
  );
}

function RoleCard({ role, color, icon, description, permissions }) {
  return (
    <Paper withBorder p="md" radius="lg" h="100%">
      <Group mb="sm">
        <ThemeIcon size={34} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Box>
          <Badge color={color} variant="light" mb={2}>{role}</Badge>
        </Box>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">{description}</Text>
      <List
        spacing={4}
        size="xs"
        icon={<IconCircleCheck size={13} color="var(--mantine-color-green-6)" />}
      >
        {permissions.map((p, i) => (
          <List.Item key={i}>{p}</List.Item>
        ))}
      </List>
    </Paper>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Paper withBorder p="md" radius="lg" h="100%">
      <ThemeIcon size={36} radius="md" variant="gradient" gradient={{ from: 'brand.6', to: 'brand.4', deg: 135 }} mb="sm">
        {icon}
      </ThemeIcon>
      <Text fw={600} mb={4}>{title}</Text>
      <Text size="sm" c="dimmed">{description}</Text>
    </Paper>
  );
}

export function HelpPage() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  function scrollTo(id) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Group align="flex-start" gap="xl" style={{ position: 'relative' }}>

      {/* Sidebar de navegação */}
      <Box
        style={{
          position: 'sticky',
          top: 80,
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" px="xs">
          Nesta página
        </Text>
        {SECTIONS.map((s) => (
          <Anchor
            key={s.id}
            component="button"
            onClick={() => scrollTo(s.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: rem(6),
              padding: '6px 10px',
              borderRadius: 8,
              fontWeight: activeSection === s.id ? 600 : 400,
              fontSize: rem(13),
              color: activeSection === s.id
                ? 'var(--mantine-color-brand-6)'
                : 'var(--mantine-color-dark-4)',
              background: activeSection === s.id
                ? 'var(--mantine-color-brand-0)'
                : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            {s.icon}
            {s.label}
          </Anchor>
        ))}
      </Box>

      {/* Conteúdo principal */}
      <Stack flex={1} gap="xl" style={{ minWidth: 0 }}>

        {/* Hero */}
        <Paper
          radius="xl"
          p="xl"
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-4) 100%)',
          }}
        >
          <Group gap="md" mb="sm">
            <ThemeIcon size={48} radius="lg" color="white" variant="white">
              <IconFileStack size={26} color="var(--mantine-color-brand-6)" />
            </ThemeIcon>
            <Box>
              <Title order={2} c="white" fw={800}>
                Central de Documentação
              </Title>
              <Text c="rgba(255,255,255,0.82)" size="sm">
                Guia completo de uso do Sistema de Gestão de Documentos
              </Text>
            </Box>
          </Group>
          <Group gap="xs" mt="md">
            <Badge color="white" variant="filled" c="brand.6" radius="sm">v1.0</Badge>
            <Badge color="rgba(255,255,255,0.2)" variant="filled" c="white" radius="sm">LRCAP 2026</Badge>
            <Badge color="rgba(255,255,255,0.2)" variant="filled" c="white" radius="sm">BESS Projects</Badge>
          </Group>
        </Paper>

        {/* ── VISÃO GERAL ── */}
        <Box>
          <SectionTitle id="visao-geral" icon={<IconBook2 size={18} />}>
            Visão Geral do Sistema
          </SectionTitle>

          <Text c="dimmed" mb="lg">
            O <Text span fw={600} c="dark">Sistema de Gestão de Documentos (SGD)</Text> é uma plataforma
            colaborativa desenvolvida para gerenciar o ciclo de vida completo de documentos técnicos em
            projetos de armazenamento de energia (BESS — <em>Battery Energy Storage System</em>), com foco
            nos requisitos do Leilão LRCAP 2026.
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
            <FeatureCard
              icon={<IconFolders size={20} />}
              title="Gestão de Projetos"
              description="Crie e gerencie múltiplos projetos com controle de acesso, clientes e configurações individuais."
            />
            <FeatureCard
              icon={<IconFileText size={20} />}
              title="Controle de Revisões"
              description="Versionamento automático de documentos com histórico completo e rastreabilidade de alterações."
            />
            <FeatureCard
              icon={<IconSitemap size={20} />}
              title="Fluxos de Aprovação"
              description="Workflows configuráveis com múltiplos aprovadores, hierarquias e controle de emissão."
            />
            <FeatureCard
              icon={<IconChecklist size={20} />}
              title="Auditorias e Checklists"
              description="Checklists de qualidade com registro de não conformidades, prazos e responsáveis."
            />
            <FeatureCard
              icon={<IconFileExport size={20} />}
              title="Relatórios e Exportação"
              description="Geração de databooks, relatórios Excel e índices PDF com todos os documentos emitidos."
            />
            <FeatureCard
              icon={<IconHistory size={20} />}
              title="Log de Auditoria"
              description="Rastreamento total de todas as ações no sistema para conformidade e transparência."
            />
          </SimpleGrid>
        </Box>

        <Divider />

        {/* ── PRIMEIROS PASSOS ── */}
        <Box>
          <SectionTitle id="primeiros-passos" icon={<IconRocket size={18} />}>
            Primeiros Passos
          </SectionTitle>

          <Alert icon={<IconInfoCircle size={16} />} color="brand" variant="light" radius="lg" mb="lg">
            Antes de começar, certifique-se de que você recebeu um convite por e-mail e que seu perfil foi
            configurado pelo administrador do sistema.
          </Alert>

          <Stack gap="sm" mb="lg">
            <StepCard step={1} title="Acesse o sistema e faça login">
              Na tela de login, informe seu e-mail e senha cadastrados. Caso seja seu primeiro acesso, use a
              opção "Criar conta" com o e-mail previamente autorizado pelo administrador.
            </StepCard>
            <StepCard step={2} title="Explore o Dashboard">
              O Dashboard exibe os principais indicadores: projetos ativos, documentos pendentes, aprovações
              em aberto, revisões reprovadas e não conformidades. É seu ponto de partida diário.
            </StepCard>
            <StepCard step={3} title="Acesse seus projetos">
              No menu lateral, clique em "Projetos" para visualizar todos os projetos aos quais você tem
              acesso. Clique em um projeto para abrir o espaço de trabalho completo.
            </StepCard>
            <StepCard step={4} title="Verifique suas aprovações pendentes">
              A seção "Minhas Aprovações" lista todas as revisões aguardando sua análise. Revise os
              documentos, aprove ou rejeite com comentários detalhados.
            </StepCard>
          </Stack>
        </Box>

        <Divider />

        {/* ── PERFIS DE ACESSO ── */}
        <Box>
          <SectionTitle id="perfis-acesso" icon={<IconShieldCheck size={18} />}>
            Perfis de Acesso
          </SectionTitle>
          <Text c="dimmed" mb="lg">
            O sistema utiliza controle de acesso baseado em papéis (RBAC). Cada usuário possui um único
            perfil que define suas permissões em toda a plataforma.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
            <RoleCard
              role="Administrador"
              color="red"
              icon={<IconCertificate size={20} />}
              description="Acesso total ao sistema. Responsável pela configuração e manutenção da plataforma."
              permissions={[
                'Gerenciar usuários e perfis',
                'Configurar fluxos de aprovação',
                'Gerenciar tipos de documentos',
                'Configurar hierarquias e conjuntos',
                'Visualizar log de auditoria completo',
                'Todas as funcionalidades de membros'
              ]}
            />
            <RoleCard
              role="Membro"
              color="brand"
              icon={<IconUsers size={20} />}
              description="Usuário padrão com acesso aos projetos. Pode criar e gerenciar documentos."
              permissions={[
                'Visualizar e criar projetos',
                'Enviar novas revisões de documentos',
                'Participar de fluxos de aprovação',
                'Visualizar histórico de revisões',
                'Exportar relatórios do projeto'
              ]}
            />
            <RoleCard
              role="Verificador"
              color="yellow"
              icon={<IconListCheck size={20} />}
              description="Responsável pela execução de checklists de auditoria e registro de não conformidades."
              permissions={[
                'Todas as permissões de membro',
                'Executar checklists de auditoria',
                'Registrar não conformidades',
                'Acompanhar resolução de NCs'
              ]}
            />
            <RoleCard
              role="Aprovador"
              color="green"
              icon={<IconUserCheck size={20} />}
              description="Usuário com autoridade formal para aprovar ou rejeitar revisões de documentos."
              permissions={[
                'Todas as permissões de membro',
                'Aprovar ou rejeitar revisões',
                'Emitir documentos aprovados',
                'Adicionar comentários de revisão'
              ]}
            />
          </SimpleGrid>

          <Paper withBorder p="md" radius="lg" bg="gray.0">
            <Group gap="xs" mb="xs">
              <IconInfoCircle size={16} color="var(--mantine-color-brand-6)" />
              <Text size="sm" fw={600}>Cliente Externo</Text>
            </Group>
            <Text size="sm" c="dimmed">
              O perfil <Badge size="xs" color="gray">Cliente Externo</Badge> permite acesso somente leitura a projetos
              específicos, ideal para clientes que precisam acompanhar o progresso sem interagir com o workflow.
            </Text>
          </Paper>
        </Box>

        <Divider />

        {/* ── PROJETOS ── */}
        <Box>
          <SectionTitle id="projetos" icon={<IconFolders size={18} />}>
            Projetos
          </SectionTitle>

          <Tabs defaultValue="criar" radius="md" mb="xl">
            <Tabs.List mb="md">
              <Tabs.Tab value="criar" leftSection={<IconFolders size={14} />}>Criar Projeto</Tabs.Tab>
              <Tabs.Tab value="configurar" leftSection={<IconSettings size={14} />}>Configurar</Tabs.Tab>
              <Tabs.Tab value="visualizar" leftSection={<IconEye size={14} />}>Navegar</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="criar">
              <Stack gap="sm">
                <Text c="dimmed" mb="xs">
                  Para criar um novo projeto, acesse a página <strong>Projetos</strong> e clique em
                  <Badge variant="filled" color="brand" size="sm" mx={4}>+ Novo Projeto</Badge>.
                  Preencha os campos obrigatórios:
                </Text>
                <Paper withBorder p="md" radius="lg">
                  <Table withColumnBorders={false} verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Campo</Table.Th>
                        <Table.Th>Descrição</Table.Th>
                        <Table.Th>Exemplo</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td><Code>Código do Projeto</Code></Table.Td>
                        <Table.Td>Identificador único alfanumérico</Table.Td>
                        <Table.Td>BESS-2026-001</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td><Code>Nome do Cliente</Code></Table.Td>
                        <Table.Td>Empresa ou pessoa responsável pelo projeto</Table.Td>
                        <Table.Td>Energia Solar S.A.</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td><Code>Fluxo de Aprovação</Code></Table.Td>
                        <Table.Td>Template de workflow a ser usado (opcional)</Table.Td>
                        <Table.Td>Fluxo Padrão BESS</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td><Code>Hierarquia</Code></Table.Td>
                        <Table.Td>Estrutura de níveis de aprovação (opcional)</Table.Td>
                        <Table.Td>Hierarquia Técnica</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td><Code>Conjunto de Documentos</Code></Table.Td>
                        <Table.Td>Define quais documentos são obrigatórios (opcional)</Table.Td>
                        <Table.Td>Conjunto LRCAP</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="configurar">
              <Text c="dimmed" mb="md">
                Dentro de um projeto, a aba <strong>Configurações</strong> permite ajustar:
              </Text>
              <List spacing="xs" size="sm" icon={<IconChevronRight size={13} color="var(--mantine-color-brand-6)" />}>
                <List.Item><strong>Fluxo de Aprovação:</strong> trocar o template de workflow aplicado ao projeto</List.Item>
                <List.Item><strong>Hierarquia:</strong> alterar a estrutura de aprovadores/verificadores do projeto</List.Item>
                <List.Item><strong>Conjunto de Documentos:</strong> definir o conjunto obrigatório para cálculo de conformidade</List.Item>
                <List.Item><strong>Acesso Externo:</strong> configurar e-mails de clientes externos com acesso somente leitura</List.Item>
                <List.Item><strong>Status do Projeto:</strong> marcar como ativo ou concluído</List.Item>
              </List>
            </Tabs.Panel>

            <Tabs.Panel value="visualizar">
              <Text c="dimmed" mb="md">
                O espaço de trabalho do projeto é organizado em abas:
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                {[
                  { icon: <IconFileText size={16} />, tab: 'Documentos', desc: 'Lista e gerencia todos os documentos vinculados ao projeto, com status e histórico de revisões.' },
                  { icon: <IconListCheck size={16} />, tab: 'Checklist', desc: 'Executa checklists de auditoria e exibe o histórico de verificações realizadas.' },
                  { icon: <IconAlertTriangle size={16} />, tab: 'Não Conformidades', desc: 'Registra e acompanha não conformidades identificadas durante a revisão.' },
                  { icon: <IconChecklist size={16} />, tab: 'Aplicabilidade', desc: 'Matriz automática mostrando documentos pendentes vs. obrigatórios pelo conjunto configurado.' },
                  { icon: <IconFileExport size={16} />, tab: 'Relatórios', desc: 'Geração de databook, índice PDF e planilha Excel com todos os dados do projeto.' },
                  { icon: <IconSettings size={16} />, tab: 'Configurações', desc: 'Ajuste as configurações específicas do projeto (fluxo, hierarquia, acesso externo).' },
                ].map((item) => (
                  <Paper key={item.tab} withBorder p="sm" radius="md">
                    <Group gap="xs" mb={4}>
                      <ThemeIcon size={22} radius="sm" color="brand" variant="light">{item.icon}</ThemeIcon>
                      <Text size="sm" fw={600}>{item.tab}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">{item.desc}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        </Box>

        <Divider />

        {/* ── DOCUMENTOS E REVISÕES ── */}
        <Box>
          <SectionTitle id="documentos" icon={<IconFileText size={18} />}>
            Documentos e Revisões
          </SectionTitle>

          <Text c="dimmed" mb="lg">
            O SGD gerencia documentos técnicos através de revisões versionadas. Cada documento pode ter
            múltiplas revisões, e o histórico completo é sempre preservado.
          </Text>

          <Paper withBorder p="md" radius="lg" mb="lg">
            <Text fw={600} mb="sm">Ciclo de vida de um documento</Text>
            <Timeline active={-1} bulletSize={28} lineWidth={2}>
              <Timeline.Item
                bullet={<IconFolders size={14} />}
                title="Pendente"
              >
                <Text size="xs" c="dimmed">Documento vinculado ao projeto, aguardando a primeira revisão ser enviada.</Text>
              </Timeline.Item>
              <Timeline.Item
                bullet={<IconUpload size={14} />}
                title="Em Revisão"
              >
                <Text size="xs" c="dimmed">Revisão enviada pelo elaborador. Aguardando aprovação no workflow configurado.</Text>
              </Timeline.Item>
              <Timeline.Item
                bullet={<IconSend size={14} />}
                title="Em Aprovação"
              >
                <Text size="xs" c="dimmed">Revisão circulando pelos aprovadores definidos no fluxo. Cada etapa pode aprovar ou rejeitar.</Text>
              </Timeline.Item>
              <Timeline.Item
                bullet={<IconCircleCheck size={14} />}
                title="Emitido"
              >
                <Text size="xs" c="dimmed">Todas as etapas de aprovação concluídas com sucesso. Documento emitido com código de revisão definitivo.</Text>
              </Timeline.Item>
            </Timeline>
          </Paper>

          <Text fw={600} mb="sm">Codificação de Revisões</Text>
          <Text size="sm" c="dimmed" mb="sm">
            O sistema utiliza nomenclatura padrão da engenharia para revisões:
          </Text>
          <Paper withBorder p="md" radius="lg" mb="lg">
            <Table withColumnBorders={false} verticalSpacing="xs" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Fase</Table.Th>
                  <Table.Th>Descrição</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  ['0A', 'Pré-emissão', 'Primeira revisão preliminar para análise interna'],
                  ['0B', 'Pré-emissão', 'Segunda revisão após comentários da análise'],
                  ['0C', 'Pré-emissão', 'Revisão adicional de pré-emissão'],
                  ['1A', 'Pós-emissão', 'Primeira revisão após emissão definitiva'],
                  ['1B', 'Pós-emissão', 'Revisão de ajuste pós-emissão'],
                ].map(([code, fase, desc]) => (
                  <Table.Tr key={code}>
                    <Table.Td><Code fw={700}>{code}</Code></Table.Td>
                    <Table.Td><Badge size="xs" color={fase === 'Pré-emissão' ? 'orange' : 'brand'} variant="light">{fase}</Badge></Table.Td>
                    <Table.Td c="dimmed">{desc}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <Alert icon={<IconBulb size={16} />} color="yellow" variant="light" radius="lg">
            <Text size="sm" fw={600} mb={4}>Como enviar uma nova revisão</Text>
            <List size="sm" spacing={2}>
              <List.Item>Abra o projeto e localize o documento desejado</List.Item>
              <List.Item>Clique no botão <strong>Nova Revisão</strong> no card do documento</List.Item>
              <List.Item>Preencha o elaborador, data e faça o upload do arquivo</List.Item>
              <List.Item>Confirme o envio — o fluxo de aprovação será iniciado automaticamente</List.Item>
            </List>
          </Alert>
        </Box>

        <Divider />

        {/* ── APROVAÇÕES ── */}
        <Box>
          <SectionTitle id="aprovacoes" icon={<IconSitemap size={18} />}>
            Fluxos de Aprovação
          </SectionTitle>

          <Text c="dimmed" mb="lg">
            Os fluxos de aprovação definem as etapas que cada revisão de documento deve percorrer antes
            de ser emitida. Cada etapa pode ser atribuída a um aprovador fixo ou a um nível hierárquico.
          </Text>

          <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="sm">
                <IconEye size={16} color="var(--mantine-color-brand-6)" />
                <Text fw={600} size="sm">Como aprovar uma revisão</Text>
              </Group>
              <List size="sm" spacing="xs" icon={<IconArrowRight size={12} color="var(--mantine-color-brand-5)" />}>
                <List.Item>Acesse <strong>Minhas Aprovações</strong> no menu lateral</List.Item>
                <List.Item>Clique na revisão pendente para visualizar o documento</List.Item>
                <List.Item>Analise o arquivo e os comentários existentes</List.Item>
                <List.Item>Clique em <Badge size="xs" color="green">Aprovar</Badge> ou <Badge size="xs" color="red">Rejeitar</Badge></List.Item>
                <List.Item>Adicione comentários justificando sua decisão</List.Item>
              </List>
            </Paper>

            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="sm">
                <IconSend size={16} color="var(--mantine-color-green-6)" />
                <Text fw={600} size="sm">Emissão do documento</Text>
              </Group>
              <Text size="sm" c="dimmed" mb="sm">
                Após todas as etapas aprovadas, o responsável designado pode emitir o documento:
              </Text>
              <List size="sm" spacing="xs" icon={<IconArrowRight size={12} color="var(--mantine-color-green-5)" />}>
                <List.Item>Abre o painel de aprovação no card do documento</List.Item>
                <List.Item>Todas as etapas exibem status <Badge size="xs" color="green">Aprovado</Badge></List.Item>
                <List.Item>Clique em <strong>Emitir</strong> para gerar o código definitivo de revisão</List.Item>
                <List.Item>O documento passa ao status <Badge size="xs" color="green">Emitido</Badge></List.Item>
              </List>
            </Paper>
          </SimpleGrid>

          <Alert icon={<IconInfoCircle size={16} />} color="brand" variant="light" radius="lg">
            Quando uma etapa é <strong>rejeitada</strong>, o elaborador original é notificado e pode enviar
            uma nova revisão (com o próximo código de revisão) para reiniciar o fluxo.
          </Alert>
        </Box>

        <Divider />

        {/* ── QUALIDADE ── */}
        <Box>
          <SectionTitle id="qualidade" icon={<IconChecklist size={18} />}>
            Qualidade e Auditoria
          </SectionTitle>

          <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
            <Box>
              <Text fw={600} mb="sm">Checklists de Auditoria</Text>
              <Text size="sm" c="dimmed" mb="sm">
                Os checklists permitem verificar sistematicamente a conformidade de projetos com
                critérios técnicos e regulatórios.
              </Text>
              <Stack gap="xs">
                {[
                  { icon: <IconListCheck size={14} />, text: 'Acesse a aba Checklist dentro do projeto' },
                  { icon: <IconEdit size={14} />, text: 'Clique em "Executar Checklist" e selecione o template' },
                  { icon: <IconCircleCheck size={14} />, text: 'Responda cada item: Conforme / Não Conforme / N.A.' },
                  { icon: <IconFileText size={14} />, text: 'Salve o resultado — o histórico fica disponível na aba' },
                ].map((item, i) => (
                  <Paper key={i} withBorder p="xs" radius="md">
                    <Group gap="xs">
                      <ThemeIcon size={22} radius="sm" color="brand" variant="light">{item.icon}</ThemeIcon>
                      <Text size="xs">{item.text}</Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Box>
              <Text fw={600} mb="sm">Não Conformidades</Text>
              <Text size="sm" c="dimmed" mb="sm">
                Registre problemas identificados durante auditorias ou revisões com rastreamento completo.
              </Text>
              <Paper withBorder p="md" radius="lg">
                <Table withColumnBorders={false} verticalSpacing="xs" fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Campo</Table.Th>
                      <Table.Th>Descrição</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[
                      ['Título', 'Descrição resumida do problema'],
                      ['Severidade', 'Crítica / Maior / Menor'],
                      ['Responsável', 'Usuário responsável pela resolução'],
                      ['Prazo', 'Data limite para resolução'],
                      ['Status', 'Aberta / Em análise / Encerrada'],
                    ].map(([field, desc]) => (
                      <Table.Tr key={field}>
                        <Table.Td><Code>{field}</Code></Table.Td>
                        <Table.Td c="dimmed">{desc}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          </SimpleGrid>

          <Paper withBorder p="md" radius="lg" bg="gray.0">
            <Group gap="xs" mb="xs">
              <IconHistory size={16} color="var(--mantine-color-brand-6)" />
              <Text size="sm" fw={600}>Log de Auditoria</Text>
              <Badge size="xs" color="red" variant="light">Admin</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Todas as ações no sistema — criação, edição, aprovação, exclusão — são registradas automaticamente
              no Log de Auditoria, acessível em <Code>Admin → Log de Auditoria</Code>. O log exibe usuário,
              data, tipo de ação e os dados anteriores/posteriores à mudança.
            </Text>
          </Paper>
        </Box>

        <Divider />

        {/* ── RELATÓRIOS ── */}
        <Box>
          <SectionTitle id="relatorios" icon={<IconFileExport size={18} />}>
            Relatórios e Exportação
          </SectionTitle>

          <Text c="dimmed" mb="lg">
            O sistema oferece múltiplos formatos de exportação para facilitar entregas a clientes,
            auditorias externas e arquivamento formal.
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
            {[
              {
                color: 'blue',
                icon: <IconFileStack size={20} />,
                title: 'Databook (ZIP)',
                desc: 'Pacote completo com todas as revisões emitidas do projeto, organizadas por tipo de documento. Ideal para entrega formal ao cliente.'
              },
              {
                color: 'red',
                icon: <IconFileDescription size={20} />,
                title: 'Índice PDF',
                desc: 'Documento PDF com índice de todos os documentos do projeto, seus códigos de revisão, status e responsáveis.'
              },
              {
                color: 'green',
                icon: <IconFileExport size={20} />,
                title: 'Planilha Excel',
                desc: 'Exportação completa em .xlsx com todos os dados do projeto: documentos, revisões, aprovadores, datas e status.'
              }
            ].map((item) => (
              <Paper key={item.title} withBorder p="md" radius="lg">
                <ThemeIcon size={36} radius="md" color={item.color} variant="light" mb="sm">
                  {item.icon}
                </ThemeIcon>
                <Text fw={600} mb={4}>{item.title}</Text>
                <Text size="sm" c="dimmed">{item.desc}</Text>
              </Paper>
            ))}
          </SimpleGrid>

          <Alert icon={<IconBulb size={16} />} color="green" variant="light" radius="lg">
            Para gerar relatórios, acesse o projeto desejado e clique na aba <strong>Relatórios</strong>.
            Os botões de exportação ficam disponíveis conforme o status dos documentos do projeto.
          </Alert>
        </Box>

        <Divider />

        {/* ── ADMINISTRAÇÃO ── */}
        <Box>
          <SectionTitle id="administracao" icon={<IconSettings size={18} />}>
            Administração do Sistema
          </SectionTitle>

          <Alert icon={<IconShieldCheck size={16} />} color="red" variant="light" radius="lg" mb="lg">
            As funções desta seção são exclusivas para usuários com perfil <strong>Administrador</strong>.
          </Alert>

          <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
            {[
              {
                icon: <IconFileText size={18} />,
                route: '/admin/document-types',
                title: 'Tipos de Documento',
                desc: 'Cadastre os tipos de documentos técnicos aceitos no sistema (ex.: Memorial Descritivo, Planta de Layout, Diagrama Unifilar).'
              },
              {
                icon: <IconSitemap size={18} />,
                route: '/admin/workflows',
                title: 'Fluxos de Aprovação',
                desc: 'Crie e edite templates de workflow com etapas ordenadas. Cada etapa pode ter aprovador fixo ou ser resolvida por nível hierárquico.'
              },
              {
                icon: <IconUsers size={18} />,
                route: '/admin/hierarchies',
                title: 'Hierarquias',
                desc: 'Defina as estruturas organizacionais com níveis (ex.: Elaborador, Verificador, Aprovador) usadas nos workflows.'
              },
              {
                icon: <IconFolderCog size={18} />,
                route: '/admin/document-sets',
                title: 'Conjuntos de Documentos',
                desc: 'Configure quais tipos de documentos são obrigatórios em cada tipo de projeto para o cálculo da matriz de aplicabilidade.'
              },
              {
                icon: <IconListCheck size={18} />,
                route: '/admin/checklists',
                title: 'Checklists de Auditoria',
                desc: 'Crie templates de checklist com itens e critérios para execução dentro de projetos pelos verificadores.'
              },
              {
                icon: <IconAdjustments size={18} />,
                route: '/admin/settings',
                title: 'Numeração de Revisão',
                desc: 'Configure as regras de codificação de revisões pré e pós-emissão (ex.: 0A → 0B → 1A) conforme padrão do projeto.'
              },
              {
                icon: <IconUsers size={18} />,
                route: '/admin/users',
                title: 'Usuários',
                desc: 'Visualize todos os usuários cadastrados e eleve perfis (membro → aprovador, verificador ou administrador).'
              },
              {
                icon: <IconHistory size={18} />,
                route: '/admin/audit-log',
                title: 'Log de Auditoria',
                desc: 'Histórico completo e imutável de todas as operações realizadas no sistema para fins de conformidade e rastreabilidade.'
              }
            ].map((item) => (
              <Paper key={item.title} withBorder p="md" radius="lg">
                <Group gap="xs" mb="xs">
                  <ThemeIcon size={28} radius="sm" color="red" variant="light">{item.icon}</ThemeIcon>
                  <Text fw={600} size="sm">{item.title}</Text>
                  <Badge size="xs" color="gray" variant="outline" ml="auto">
                    <Code style={{ fontSize: 10 }}>{item.route}</Code>
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">{item.desc}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        <Divider />

        {/* ── MEMORIAL DESCRITIVO ── */}
        <Box>
          <SectionTitle id="memorial" icon={<IconFileDescription size={18} />}>
            Memorial Descritivo
          </SectionTitle>

          <Text c="dimmed" mb="lg">
            O <strong>Gerador de Memorial Descritivo</strong> é uma ferramenta separada, integrada ao sistema,
            que produz documentos Word (.docx) e PDF com estrutura profissional para projetos BESS, seguindo
            os requisitos técnicos do leilão LRCAP 2026.
          </Text>

          <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
            <Paper withBorder p="md" radius="lg">
              <Text fw={600} mb="sm">Funcionalidades</Text>
              <List size="sm" spacing="xs" icon={<IconCircleCheck size={13} color="var(--mantine-color-green-6)" />}>
                <List.Item>Geração de documentos Word (.docx) com timbrado</List.Item>
                <List.Item>Geração de PDF com layout profissional</List.Item>
                <List.Item>Controle de revisão com tabela de aprovação (REV, DATA, ELAB., VER., APR.)</List.Item>
                <List.Item>Sumário automático com numeração de páginas</List.Item>
                <List.Item>Tabelas de coordenadas geoespaciais</List.Item>
                <List.Item>Especificações técnicas do BESS (potência, capacidade, química)</List.Item>
                <List.Item>Procedimentos de segurança e emergência</List.Item>
                <List.Item>Upload de arquivos organizados por tipo (Anexo 1–8)</List.Item>
              </List>
            </Paper>

            <Paper withBorder p="md" radius="lg">
              <Text fw={600} mb="sm">Como acessar</Text>
              <Text size="sm" c="dimmed" mb="md">
                O Memorial Descritivo está disponível via link no menu lateral:
              </Text>
              <Paper withBorder p="sm" radius="md" bg="gray.0">
                <Group gap="xs">
                  <IconFileDescription size={16} color="var(--mantine-color-brand-6)" />
                  <Text size="sm" fw={500}>Memorial Descritivo</Text>
                  <Badge size="xs" color="blue" variant="light" ml="auto">Abre em nova aba</Badge>
                </Group>
              </Paper>
              <Text size="xs" c="dimmed" mt="sm">
                A ferramenta abre em uma nova aba do navegador e possui sua própria interface de formulário
                para preenchimento das informações do projeto.
              </Text>
            </Paper>
          </SimpleGrid>
        </Box>

        <Divider />

        {/* Rodapé */}
        <Paper withBorder p="md" radius="lg" bg="gray.0">
          <Group gap="xs" mb="xs">
            <IconStarFilled size={16} color="var(--mantine-color-yellow-5)" />
            <Text size="sm" fw={600}>Dicas para uso eficiente</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {[
              'Configure o conjunto de documentos do projeto para que a matriz de aplicabilidade mostre as lacunas automaticamente.',
              'Use os checklists antes de emitir um documento para garantir conformidade com os requisitos técnicos.',
              'Mantenha comentários detalhados ao reprovar uma revisão para agilizar a reelaboração pelo elaborador.',
              'Exporte o databook assim que todos os documentos estiverem emitidos para entrega formal ao cliente.',
              'O log de auditoria é útil para resolver disputas — toda ação fica registrada com data, hora e usuário.',
              'Perfis de Cliente Externo permitem que o cliente acompanhe o projeto sem acesso às configurações internas.'
            ].map((tip, i) => (
              <Group key={i} align="flex-start" gap="xs">
                <IconBulb size={14} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0, marginTop: 2 }} />
                <Text size="xs" c="dimmed">{tip}</Text>
              </Group>
            ))}
          </SimpleGrid>
        </Paper>

        <Text size="xs" c="dimmed" ta="center" pb="lg">
          Sistema de Gestão de Documentos — LRCAP 2026 · Para suporte técnico, contate o administrador do sistema.
        </Text>

      </Stack>
    </Group>
  );
}
