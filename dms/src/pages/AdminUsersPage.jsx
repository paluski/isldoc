import { useEffect, useState } from 'react';
import { Title, Stack, Table, Select, Loader, Center, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function AdminUsersPage() {
  const { user: currentUser, refreshProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao carregar usuários: ${error.message}` });
    } else {
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRoleChange(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) {
      notifications.show({ color: 'red', message: `Erro ao atualizar papel: ${error.message}` });
      return;
    }
    notifications.show({ color: 'green', message: 'Papel atualizado!' });
    load();
    if (userId === currentUser.id) refreshProfile();
  }

  if (loading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Title order={2}>Usuários</Title>
      <Text c="dimmed" size="sm">
        Defina quem tem acesso de administrador (configurações, tipos de documento, fluxos).
      </Text>

      <Table withTableBorder striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Papel</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((u) => (
            <Table.Tr key={u.id}>
              <Table.Td>{u.full_name || u.id}</Table.Td>
              <Table.Td>
                <Select
                  data={[
                    { value: 'member', label: 'Membro' },
                    { value: 'admin', label: 'Administrador' }
                  ]}
                  value={u.role}
                  onChange={(v) => handleRoleChange(u.id, v)}
                  w={200}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
