import { useState, useMemo } from 'react';
import { Modal, Stack, FileInput, Text, Button, Group, Badge, Textarea } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { getNextRevisionCode } from '../lib/revisionRules';

export function UploadRevisionModal({ opened, onClose, projectDocument, settings, onUploaded }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const nextCode = useMemo(
    () => getNextRevisionCode(projectDocument?.currentRevisionCode ?? null, { isEmission: false }, settings),
    [projectDocument, settings]
  );

  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'dwg', 'dxf', 'png', 'jpg', 'jpeg'];
  const MAX_SIZE_MB = 50;

  async function handleUpload() {
    if (!file) {
      notifications.show({ color: 'red', message: 'Selecione um arquivo.' });
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      notifications.show({ color: 'red', message: `Tipo de arquivo não permitido. Use: ${ALLOWED_EXTENSIONS.join(', ')}.` });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      notifications.show({ color: 'red', message: `O arquivo excede o limite de ${MAX_SIZE_MB} MB.` });
      return;
    }
    setSaving(true);

    const storagePath = `${projectDocument.project_id}/${projectDocument.id}/${nextCode}__${file.name}`;

    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file, {
      upsert: false
    });

    if (uploadError) {
      setSaving(false);
      notifications.show({ color: 'red', message: `Erro ao enviar arquivo: ${uploadError.message}` });
      return;
    }

    const { data: revision, error: revisionError } = await supabase
      .from('document_revisions')
      .insert({
        project_document_id: projectDocument.id,
        revision_code: nextCode,
        storage_path: storagePath,
        file_name: file.name,
        uploaded_by: user.id,
        is_emission: false,
        status: 'rascunho',
        notes: notes || null
      })
      .select()
      .single();

    if (revisionError) {
      setSaving(false);
      notifications.show({ color: 'red', message: `Erro ao registrar revisão: ${revisionError.message}` });
      return;
    }

    await supabase
      .from('project_documents')
      .update({ current_revision_id: revision.id, status: 'em_revisao' })
      .eq('id', projectDocument.id);

    setSaving(false);
    notifications.show({ color: 'green', message: `Revisão ${nextCode} enviada com sucesso!` });
    setFile(null);
    setNotes('');
    onClose();
    onUploaded();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Nova Revisão — ${projectDocument?.documentTypeName ?? ''}`} centered>
      <Stack>
        <Group>
          <Text size="sm">Próxima revisão será:</Text>
          <Badge size="lg" color="brand">
            {nextCode}
          </Badge>
        </Group>

        <FileInput
          label="Arquivo"
          description="PDF, DOCX, XLSX, DWG, DXF, PNG, JPG — máx. 50 MB"
          placeholder="Selecione o arquivo"
          leftSection={<IconUpload size={16} />}
          accept=".pdf,.docx,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg"
          value={file}
          onChange={setFile}
          required
        />

        <Textarea
          label="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={2}
        />

        <Text size="xs" c="dimmed">
          Depois de enviada, use o botão "Enviar para Aprovação" no documento para seguir o fluxo configurado para este
          projeto.
        </Text>

        <Button onClick={handleUpload} loading={saving} fullWidth>
          Enviar Revisão
        </Button>
      </Stack>
    </Modal>
  );
}
