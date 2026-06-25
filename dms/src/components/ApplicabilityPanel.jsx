import { useEffect, useState } from 'react';
import { Paper, Title, Text, Stack, Badge, Group, List, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconClock, IconCircleCheck } from '@tabler/icons-react';
import { supabase } from '../lib/supabaseClient';
import { computeApplicabilityGaps } from '../lib/applicability';

export function ApplicabilityPanel({ project, documents }) {
  const [requiredItems, setRequiredItems] = useState(null);

  useEffect(() => {
    if (!project.document_set_template_id) {
      setRequiredItems([]);
      return;
    }
    supabase
      .from('document_set_template_items')
      .select('document_type_id, document_types(name)')
      .eq('document_set_template_id', project.document_set_template_id)
      .then(({ data }) => setRequiredItems(data ?? []));
  }, [project.document_set_template_id]);

  if (!project.document_set_template_id) {
    return (
      <Paper withBorder p="md" radius="lg">
        <Title order={4} mb="xs">
          Matriz de Aplicabilidade
        </Title>
        <Text size="sm" c="dimmed">
          Nenhum conjunto de documentos vinculado a este projeto — vincule um em "Configurações do Projeto" para
          acompanhar pendências automaticamente.
        </Text>
      </Paper>
    );
  }

  if (requiredItems === null) return null;

  const linkedDocuments = documents.map((d) => ({ document_type_id: d.document_type_id, status: d.status }));
  const { missing, pending, requiredCount, gapCount } = computeApplicabilityGaps(requiredItems, linkedDocuments);

  return (
    <Paper withBorder p="md" radius="lg">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Matriz de Aplicabilidade</Title>
        <Badge color={gapCount === 0 ? 'green' : gapCount <= 2 ? 'yellow' : 'red'} size="lg">
          {requiredCount - gapCount}/{requiredCount} completo
        </Badge>
      </Group>

      {gapCount === 0 ? (
        <Group gap="xs">
          <ThemeIcon color="green" variant="light" radius="xl">
            <IconCircleCheck size={16} />
          </ThemeIcon>
          <Text size="sm">Todos os documentos exigidos estão vinculados e emitidos.</Text>
        </Group>
      ) : (
        <Stack gap="sm">
          {missing.length > 0 && (
            <div>
              <Group gap="xs" mb={4}>
                <ThemeIcon color="red" variant="light" radius="xl" size="sm">
                  <IconAlertCircle size={12} />
                </ThemeIcon>
                <Text size="sm" fw={600}>
                  Faltando vincular ({missing.length})
                </Text>
              </Group>
              <List size="sm" withPadding>
                {missing.map((item) => (
                  <List.Item key={item.document_type_id}>{item.document_types?.name}</List.Item>
                ))}
              </List>
            </div>
          )}

          {pending.length > 0 && (
            <div>
              <Group gap="xs" mb={4}>
                <ThemeIcon color="yellow" variant="light" radius="xl" size="sm">
                  <IconClock size={12} />
                </ThemeIcon>
                <Text size="sm" fw={600}>
                  Vinculados, ainda não emitidos ({pending.length})
                </Text>
              </Group>
              <List size="sm" withPadding>
                {pending.map((item) => (
                  <List.Item key={item.document_type_id}>
                    {item.document_types?.name} — <Text span c="dimmed">{item.status}</Text>
                  </List.Item>
                ))}
              </List>
            </div>
          )}
        </Stack>
      )}
    </Paper>
  );
}
