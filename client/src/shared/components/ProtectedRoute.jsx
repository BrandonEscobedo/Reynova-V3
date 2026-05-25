import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div> 
    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        Cargando...</div>;
  }

  return user ? children : <Navigate to="/login" />;

}