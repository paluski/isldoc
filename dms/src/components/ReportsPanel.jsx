import { useState } from 'react';
import { Paper, Title, Group, Button, Text } from '@mantine/core';
import { IconFileTypePdf, IconFileSpreadsheet, IconFileZip } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { generateDatabookIndexPdf, exportProjectDocumentsToExcel, downloadDatabookZip } from '../lib/reports';

export function ReportsPanel({ project, documents }) {
  const [busy, setBusy] = useState(null);

  async function handlePdf() {
    setBusy('pdf');
    try {
      generateDatabookIndexPdf(project, documents);
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao gerar PDF: ${err.message}` });
    }
    setBusy(null);
  }

  async function handleExcel() {
    setBusy('excel');
    try {
      await exportProjectDocumentsToExcel(project, documents);
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao exportar Excel: ${err.message}` });
    }
    setBusy(null);
  }

  async function handleZip() {
    setBusy('zip');
    try {
      const count = await downloadDatabookZip(project, documents);
      notifications.show({ color: 'green', message: `Databook gerado com ${count} documento(s) emitido(s).` });
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao gerar databook: ${err.message}` });
    }
    setBusy(null);
  }

  return (
    <Paper withBorder p="md" radius="lg">
      <Title order={4} mb="xs">
        Relatórios
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Exporte o índice de documentos do projeto ou o pacote completo com as revisões emitidas.
      </Text>
      <Group>
        <Button size="xs" variant="light" leftSection={<IconFileTypePdf size={14} />} loading={busy === 'pdf'} onClick={handlePdf}>
          Índice (PDF)
        </Button>
        <Button size="xs" variant="light" leftSection={<IconFileSpreadsheet size={14} />} loading={busy === 'excel'} onClick={handleExcel}>
          Exportar Excel
        </Button>
        <Button size="xs" variant="light" leftSection={<IconFileZip size={14} />} loading={busy === 'zip'} onClick={handleZip}>
          Databook Completo (ZIP)
        </Button>
      </Group>
    </Paper>
  );
}
