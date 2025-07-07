// frontend/src/context/useAuth.js

import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Importa o contexto do arquivo principal

// Este hook customizado é um atalho para não ter que importar useContext e AuthContext em todo lugar
export const useAuth = () => {
  return useContext(AuthContext);
};