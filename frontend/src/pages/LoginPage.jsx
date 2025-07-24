// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/useAuth.js';
// 1. IMPORTAR useLocation
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 2. PEGAR A LOCALIZAÇÃO

  // 3. DETERMINAR O DESTINO
  // Pega o caminho de 'from' que o ProtectedRoute nos enviou.
  // Se não houver (usuário foi direto para /login), o padrão é a página inicial '/'.
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);

    if (success) {
      // 4. USA O CAMINHO DE DESTINO DETERMINADO
      // O 'replace: true' substitui a página de login no histórico,
      // para que o usuário não volte para ela ao clicar no botão "voltar" do navegador.
      navigate(from, { replace: true });
    } else {
      alert('Usuário ou senha inválidos.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </form>
  );
}

export default LoginPage;