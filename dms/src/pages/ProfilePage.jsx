import { Stack, Title, Paper, Group, Avatar, Text, Badge, SimpleGrid, Divider, Button } from '@mantine/core';
import { IconMail, IconShieldLock, IconCalendar, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../lib/roles';

function Field({ icon, label, value }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar variant="light" color="gray" radius="md" size={38}>
        {icon}
      </Avatar>
      <div>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {label}
        </Text>
        <Text size="sm" fw={500}>
          {value || '—'}
        </Text>
      </div>
    </Group>
  );
}

export function ProfilePage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const name = profile?.full_name || user?.email || 'Usuário';

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <Stack>
      <Title order={2}>Perfil</Title>

      <Paper withBorder p="xl" radius="lg">
        <Group justify="space-between" align="flex-start">
          <Group>
            <Avatar color="brand" radius="xl" size={72} variant="filled">
              {name.slice(0, 1).toUpperCase()}
            </Avatar>
            <div>
              <Text fw={700} size="xl">
                {name}
              </Text>
              <Badge mt={6} variant="light" color={isAdmin ? 'brand' : 'gray'}>
                {roleLabel(profile?.role) || (isAdmin ? 'Administrador' : 'Membro')}
              </Badge>
            </div>
          </Group>
          <Button variant="subtle" color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Encerrar sessão
          </Button>
        </Group>

        <Divider my="lg" />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Field icon={<IconMail size={18} />} label="E-mail" value={user?.email} />
          <Field icon={<IconShieldLock size={18} />} label="Perfil de acesso" value={roleLabel(profile?.role)} />
          <Field
            icon={<IconCalendar size={18} />}
            label="Membro desde"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                : user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR')
                : '—'
            }
          />
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}
