import { useState, Fragment } from 'react';
import { Table, Badge, ActionIcon, Collapse, Box, Text } from '@mantine/core';
import { IconDownload, IconMessageCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { CommentThread } from './CommentThread';

const STATUS_COLORS = {
  rascunho: 'gray',
  em_analise: 'yellow',
  aprovado: 'green',
  reprovado: 'red',
  emitido: 'brand'
};

function fileExtension(fileName) {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx) : '';
}

export function RevisionHistoryTable({ revisions, nomePadraoArquivo }) {
  const [openCommentsId, setOpenCommentsId] = useState(null);

  async function handleDownload(rev) {
    const { data, error } = await supabase.storage.from('documents').download(rev.storage_path);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao baixar arquivo: ${error.message}` });
      return;
    }
    const ext = fileExtension(rev.file_name);
    const downloadName = `${nomePadraoArquivo}_${rev.revision_code}${ext}`;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!revisions || revisions.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Nenhuma revisão enviada ainda.
      </Text>
    );
  }

  return (
    <Table verticalSpacing="xs" highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Revisão</Table.Th>
          <Table.Th>Data</Table.Th>
          <Table.Th>Enviado por</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Emissão</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {revisions.map((rev) => (
          <Fragment key={rev.id}>
            <Table.Tr>
              <Table.Td>
                <Badge variant="light" color="brand">
                  {rev.revision_code}
                </Badge>
              </Table.Td>
              <Table.Td>{new Date(rev.uploaded_at).toLocaleString('pt-BR')}</Table.Td>
              <Table.Td>{rev.profiles?.full_name || '—'}</Table.Td>
              <Table.Td>
                <Badge color={STATUS_COLORS[rev.status] || 'gray'} variant="light">
                  {rev.status}
                </Badge>
              </Table.Td>
              <Table.Td>{rev.is_emission ? '✓' : ''}</Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" onClick={() => handleDownload(rev)} title="Baixar este arquivo">
                  <IconDownload size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  onClick={() => setOpenCommentsId(openCommentsId === rev.id ? null : rev.id)}
                  title="Comentários"
                >
                  <IconMessageCircle size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td colSpan={6} p={0}>
                <Collapse in={openCommentsId === rev.id}>
                  <Box p="sm" bg="gray.0">
                    <CommentThread revisionId={rev.id} />
                  </Box>
                </Collapse>
              </Table.Td>
            </Table.Tr>
          </Fragment>
        ))}
      </Table.Tbody>
    </Table>
  );
}
