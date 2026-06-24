import { useEffect, useState } from 'react';
import { Stack, Text, Textarea, Button, Group, Paper, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function CommentThread({ revisionId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('revision_comments')
      .select('id, comment, created_at, profiles(full_name)')
      .eq('document_revision_id', revisionId)
      .order('created_at', { ascending: true });
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar comentários: ${error.message}` });
    } else {
      setComments(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (revisionId) load();
  }, [revisionId]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('revision_comments')
      .insert({ document_revision_id: revisionId, user_id: user.id, comment: text.trim() });
    setSending(false);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao enviar comentário: ${error.message}` });
      return;
    }
    setText('');
    load();
  }

  if (loading) {
    return (
      <Center py="sm">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Stack gap="xs">
      {comments.length === 0 && (
        <Text size="sm" c="dimmed">
          Nenhum comentário ainda.
        </Text>
      )}
      {comments.map((c) => (
        <Paper key={c.id} p="xs" radius="sm" withBorder bg="gray.0">
          <Text size="xs" fw={600}>
            {c.profiles?.full_name || 'Usuário'}{' '}
            <Text span c="dimmed" size="xs">
              {new Date(c.created_at).toLocaleString('pt-BR')}
            </Text>
          </Text>
          <Text size="sm">{c.comment}</Text>
        </Paper>
      ))}
      <Group align="flex-end">
        <Textarea
          placeholder="Escreva um comentário..."
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          style={{ flex: 1 }}
          minRows={1}
          autosize
        />
        <Button onClick={handleSend} loading={sending} size="sm">
          Enviar
        </Button>
      </Group>
    </Stack>
  );
}
