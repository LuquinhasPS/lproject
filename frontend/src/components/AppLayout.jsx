// frontend/src/components/AppLayout.jsx

import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function AppLayout() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            LProject
          </Typography>
          <Button color="inherit" onClick={() => navigate('/clientes')}>Clientes</Button>
          {authToken && (
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, mt: '64px' }} // mt:'64px' para não ficar atrás do AppBar
      >
        {/* O conteúdo da página atual será renderizado aqui */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default AppLayout;