import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Paper, Title, Text, TextInput, PasswordInput, Button, Stack, Tabs, Alert, Center, ThemeIcon, Group } from '@mantine/core';
import { IconFileStack } from '@tabler/icons-react';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { user, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    if (mode === 'signin') {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error: signUpError } = await signUp(email, password, fullName);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setInfo('Conta criada! Verifique seu e-mail se a confirmação estiver ativada, ou faça login.');
        setMode('signin');
      }
    }
    setSubmitting(false);
  }

  return (
    <Center
      h="100vh"
      w="100%"
      style={{
        background: 'linear-gradient(150deg, #2c3a8f 0%, #4555c0 45%, #6373dd 100%)'
      }}
    >
      <Paper shadow="xl" radius="lg" p="xl" w={420} withBorder style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
        <Group justify="center" mb="sm">
          <ThemeIcon size={48} radius="md" variant="gradient" gradient={{ from: 'brand.6', to: 'brand.4', deg: 135 }}>
            <IconFileStack size={26} />
          </ThemeIcon>
        </Group>
        <Title order={2} ta="center" mb={4} c="dark.6">
          Gestão de Documentos
        </Title>
        <Text ta="center" size="sm" c="dimmed" mb="lg">
          Projetos, revisões e fluxos de aprovação em um só lugar
        </Text>

        <Tabs value={mode} onChange={setMode} mb="md" radius="md">
          <Tabs.List grow>
            <Tabs.Tab value="signin">Entrar</Tabs.Tab>
            <Tabs.Tab value="signup">Criar conta</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <form onSubmit={handleSubmit}>
          <Stack>
            {mode === 'signup' && (
              <TextInput
                label="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.currentTarget.value)}
                required
              />
            )}
            <TextInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />

            {error && (
              <Alert color="red" radius="md">
                {error}
              </Alert>
            )}
            {info && (
              <Alert color="green" radius="md">
                {info}
              </Alert>
            )}

            <Button type="submit" loading={submitting} fullWidth size="md" mt="xs">
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
