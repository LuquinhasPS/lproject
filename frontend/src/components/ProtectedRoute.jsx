// frontend/src/components/ProtectedRoute.jsx

import React from 'react';
// 1. IMPORTAR useLocation
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProtectedRoute() {
  const { authToken } = useAuth();
  const location = useLocation(); // 2. PEGAR A LOCALIZAÇÃO ATUAL

  if (!authToken) {
    // 3. PASSAR A LOCALIZAÇÃO NO 'state' DO REDIRECIONAMENTO
    // Isso "anota" de qual página o usuário veio.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;