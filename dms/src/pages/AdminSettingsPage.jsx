import { useEffect, useMemo, useState } from 'react';
import { Title, Stack, Paper, Select, NumberInput, TextInput, Button, Text, Code, Group, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { getNextRevisionCode } from '../lib/revisionRules';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('revision_numbering_settings').select('*').eq('scope', 'global').single();
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar configurações: ${error.message}` });
    } else {
      setSettings(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('revision_numbering_settings')
      .update({
        pre_emission_increment: settings.pre_emission_increment,
        post_emission_increment: settings.post_emission_increment,
        initial_number: settings.initial_number,
        initial_letter: settings.initial_letter
      })
      .eq('id', settings.id);
    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', message: `Erro ao salvar: ${error.message}` });
      return;
    }
    notifications.show({ color: 'green', message: 'Configurações de numeração salvas!' });
  }

  const preview = useMemo(() => {
    if (!settings) return [];
    const steps = [
      { isEmission: false },
      { isEmission: false },
      { isEmission: true },
      { isEmission: false },
      { isEmission: true }
    ];
    let code = null;
    const codes = [];
    for (const step of steps) {
      code = getNextRevisionCode(code, step, settings);
      codes.push(`${code}${step.isEmission ? ' (emissão)' : ''}`);
    }
    return codes;
  }, [settings]);

  if (loading || !settings) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack maw={520}>
      <Title order={2}>Numeração de Revisão</Title>
      <Text c="dimmed" size="sm">
        Define como o código de revisão evolui antes e depois de uma emissão (aprovação final).
      </Text>

      <Paper withBorder p="md" radius="md">
        <Stack>
          <Group grow>
            <TextInput
              label="Número inicial"
              value={String(settings.initial_number)}
              onChange={(e) => {
                const parsed = parseInt(e.currentTarget.value || '0', 10);
                setSettings((s) => ({ ...s, initial_number: parsed }));
              }}
            />
            <TextInput
              label="Letra inicial"
              value={settings.initial_letter}
              onChange={(e) => {
                const upper = e.currentTarget.value.toUpperCase();
                setSettings((s) => ({ ...s, initial_letter: upper }));
              }}
            />
          </Group>

          <Select
            label="Antes da primeira emissão, incrementa"
            data={[
              { value: 'letter', label: 'Letra (0A → 0B → 0C...)' },
              { value: 'number', label: 'Número' }
            ]}
            value={settings.pre_emission_increment}
            onChange={(v) => setSettings((s) => ({ ...s, pre_emission_increment: v }))}
          />

          <Select
            label="Quando é uma emissão, incrementa"
            data={[
              { value: 'number', label: 'Número (0C → 1A, 1B → 2A...)' },
              { value: 'letter', label: 'Letra' }
            ]}
            value={settings.post_emission_increment}
            onChange={(v) => setSettings((s) => ({ ...s, post_emission_increment: v }))}
          />

          <Button onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md" bg="gray.0">
        <Text size="sm" fw={600} mb="xs">
          Pré-visualização (a partir do início):
        </Text>
        <Code block>{preview.join(' → ')}</Code>
      </Paper>
    </Stack>
  );
}
