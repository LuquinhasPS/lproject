// frontend/src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { Button } from '@mui/material';

function Navbar() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Chama a função de logout do contexto (que limpa o token)
    navigate('/login'); // Redireciona para a página de login
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
      <div>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/clientes">Clientes</Link>
      </div>
      <div>
        {authToken && (
          <Button variant="outlined" onClick={handleLogout}>
            Sair
          </Button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;