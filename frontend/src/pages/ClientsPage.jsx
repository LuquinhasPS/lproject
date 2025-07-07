// frontend/src/pages/ClientsPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import NewClientForm from '../components/NewClientForm'; // <-- 1. IMPORTAR O FORMULÁRIO
import { Button, Box, Typography, Grid, Card, CardContent, CardActions } from '@mui/material';


function ClientsPage() {
  const [clients, setClients] = useState([]);
  // 2. ADICIONAR UM ESTADO PARA CONTROLAR A VISIBILIDADE DO FORMULÁRIO
  const [showForm, setShowForm] = useState(false);

useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await apiClient.get('/clientes/'); 
        setClients(response.data);
      } catch (error) {
        console.error("Houve um erro ao buscar os clientes!", error);
      }
    };
    fetchClients();
  }, []);

  // 3. CRIAR A FUNÇÃO QUE SERÁ PASSADA PARA O COMPONENTE FILHO
  const handleClientAdded = (newClient) => {
    // Adiciona o novo cliente à lista existente, evitando um novo fetch à API
    setClients(currentClients => [newClient, ...currentClients]);
    setShowForm(false); // Esconde o formulário após o sucesso
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Clientes</Typography>
        <Button variant="contained" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Novo Cliente'}
        </Button>
      </Box>

      {showForm && <NewClientForm onClientAdded={handleClientAdded} />}

      <hr />

      {/* --- NOVA RENDERIZAÇÃO DA LISTA --- */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {clients.map(client => (
          <Grid item key={client.id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {client.nome}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  ID: {client.id}
                </Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/clientes/${client.id}`} size="small">Ver Detalhes</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default ClientsPage;