// frontend/src/context/AuthContext.jsx

import React, { createContext, useState } from 'react';
import apiClient from '../api/axiosConfig';

// 1. O Contexto é criado e exportado para que o hook 'useAuth' possa usá-lo
export const AuthContext = createContext(null);

// 2. O Provedor (AuthProvider) é o componente que vai "envelopar" a aplicação
export const AuthProvider = ({ children }) => {
  // Inicializa o state do token buscando do localStorage para manter a sessão
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('accessToken'));

  // Função de Login centralizada
  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/token/', { username, password });
      
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      setAuthToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return true; // Retorna sucesso
    } catch (error) {
      console.error("Falha no login", error);
      // Limpa qualquer resquício de tokens em caso de falha
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
      return false; // Retorna falha
    }
  };

  // Função de Logout centralizada
  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  // Objeto com os valores que serão compartilhados com os componentes filhos
  const value = {
    authToken,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Lembre-se: O hook 'useAuth' foi movido para seu próprio arquivo, 'useAuth.js',
// para resolver o aviso do Vite Fast Refresh.