import { Navigate, Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ adminOnly = false }) {
  const { isLoading, user, isAdmin, profileLoading } = useAuth();

  if (isLoading || profileLoading) {
    return (
      <Center h="100vh">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
}
