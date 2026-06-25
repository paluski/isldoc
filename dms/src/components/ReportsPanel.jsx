import { useState } from 'react';
import { Paper, Title, Group, Button, Text, Stack, Divider, Badge } from '@mantine/core';
import { IconFileTypePdf, IconFileSpreadsheet, IconFileZip, IconHistory } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { generateDatabookIndexPdf, exportProjectDocumentsToExcel, downloadDatabookZip } from '../lib/reports';

export function ReportsPanel({ project, documents }) {
  const [busy, setBusy] = useState(null);
  const [history, setHistory] = useState([]);

  function addHistory(type, label) {
    setHistory((h) => [{ type, label, at: new Date() }, ...h].slice(0, 10));
  }

  async function handlePdf() {
    setBusy('pdf');
    try {
      generateDatabookIndexPdf(project, documents);
      addHistory('PDF', 'Índice PDF');
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao gerar PDF: ${err.message}` });
    }
    setBusy(null);
  }

  async function handleExcel() {
    setBusy('excel');
    try {
      await exportProjectDocumentsToExcel(project, documents);
      addHistory('Excel', 'Exportação Excel');
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao exportar Excel: ${err.message}` });
    }
    setBusy(null);
  }

  async function handleZip() {
    setBusy('zip');
    try {
      const { count, skipped } = await downloadDatabookZip(project, documents);
      addHistory('ZIP', `Databook ZIP (${count} doc${count !== 1 ? 's' : ''})`);
      if (skipped > 0) {
        notifications.show({ color: 'yellow', message: `Databook gerado com ${count} documento(s). ${skipped} arquivo(s) não puderam ser baixados.` });
      } else {
        notifications.show({ color: 'green', message: `Databook gerado com ${count} documento(s) emitido(s).` });
      }
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro ao gerar databook: ${err.message}` });
    }
    setBusy(null);
  }

  const TYPE_COLORS = { PDF: 'red', Excel: 'green', ZIP: 'blue' };

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

      {history.length > 0 && (
        <>
          <Divider mt="md" mb="xs" />
          <Stack gap={4}>
            <Group gap="xs">
              <IconHistory size={14} />
              <Text size="xs" fw={600} c="dimmed">Histórico desta sessão</Text>
            </Group>
            {history.map((h, i) => (
              <Group key={i} gap="xs">
                <Badge size="xs" color={TYPE_COLORS[h.type] ?? 'gray'} variant="light">{h.type}</Badge>
                <Text size="xs">{h.label}</Text>
                <Text size="xs" c="dimmed">{h.at.toLocaleTimeString('pt-BR')}</Text>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
