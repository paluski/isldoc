import { useState } from 'react';
import { Card, Group, Text, Badge, Button, Select, Accordion, Divider } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { RevisionHistoryTable } from './RevisionHistoryTable';
import { UploadRevisionModal } from './UploadRevisionModal';
import { ApprovalStepsPanel } from './ApprovalStepsPanel';

export function DocumentCard({ doc, profiles, settings, project, onChanged }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const latestRevision = doc.revisions?.[0] ?? null;
  const currentCode = latestRevision?.revision_code ?? null;

  async function handleResponsibleChange(userId) {
    const { error } = await supabase
      .from('project_documents')
      .update({ responsible_user_id: userId || null })
      .eq('id', doc.id);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao atualizar responsável: ${error.message}` });
      return;
    }
    onChanged();
  }

  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <div>
          <Text fw={600}>{doc.document_types?.name}</Text>
          <Text size="xs" c="dimmed">
            {doc.nome_padrao_arquivo}
          </Text>
        </div>
        <Group gap="xs">
          {currentCode && (
            <Badge color="brand" size="lg">
              {currentCode}
            </Badge>
          )}
          <Badge color="gray" variant="outline">
            {doc.status}
          </Badge>
        </Group>
      </Group>

      <Group justify="space-between" align="flex-end" mb="sm">
        <Select
          label="Responsável pelo próximo fluxo"
          placeholder="Selecione um responsável"
          data={profiles.map((p) => ({ value: p.id, label: p.full_name || p.id }))}
          value={doc.responsible_user_id}
          onChange={handleResponsibleChange}
          clearable
          w={280}
        />
        <Button leftSection={<IconUpload size={16} />} onClick={() => setUploadOpen(true)} size="sm">
          Enviar Nova Revisão
        </Button>
      </Group>

      {latestRevision && latestRevision.status !== 'finalizado' && (
        <>
          <Divider label="Fluxo de aprovação da revisão atual" labelPosition="left" mb="xs" />
          <ApprovalStepsPanel
            revision={latestRevision}
            projectDocument={doc}
            project={project}
            settings={settings}
            onChanged={onChanged}
          />
        </>
      )}

      <Accordion variant="contained" mt="sm">
        <Accordion.Item value="history">
          <Accordion.Control>Histórico de revisões ({doc.revisions?.length ?? 0})</Accordion.Control>
          <Accordion.Panel>
            <RevisionHistoryTable revisions={doc.revisions} nomePadraoArquivo={doc.nome_padrao_arquivo} />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <UploadRevisionModal
        opened={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectDocument={{
          ...doc,
          currentRevisionCode: currentCode,
          documentTypeName: doc.document_types?.name
        }}
        settings={settings}
        onUploaded={onChanged}
      />
    </Card>
  );
}
