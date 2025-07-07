// frontend/src/pages/ClientDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import NewProjectForm from '../components/NewProjectForm';
import { Button, CircularProgress, Typography, Alert, TextField, Box } from '@mui/material';

function ClientDetailPage() {
  const { clientId } = useParams(); 
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ nome: '' });

  useEffect(() => {
    const fetchClientDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/clientes/${clientId}/`);
        setClient(response.data);
        setEditData({ nome: response.data.nome }); 
      } catch (err) {
        setError('Não foi possível carregar os dados do cliente.');
        console.error("Erro detalhado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  const handleProjectAdded = (newProject) => {
    setClient(currentClient => ({
      ...currentClient,
      projetos: [newProject, ...currentClient.projetos],
    }));
    setShowProjectForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.patch(`/clientes/${clientId}/`, editData);
      setClient(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar o cliente:", error);
      alert('Não foi possível atualizar o cliente.');
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar o cliente "${client.nome}"?`)) {
      try {
        await apiClient.delete(`/clientes/${clientId}/`);
        alert('Cliente deletado com sucesso!');
        navigate('/clientes');
      } catch (error) {
        console.error("Erro ao deletar o cliente:", error);
        alert('Não foi possível deletar o cliente.');
      }
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!client) return <Typography>Nenhum cliente encontrado.</Typography>;

// Em frontend/src/pages/ClientDetailPage.jsx

// ... (toda a sua lógica de states e handlers continua a mesma)

return (
    <div>
      <Link to="/clientes">&larr; Voltar para a lista de clientes</Link>

      {/* Bloco de Edição/Visualização do Nome do Cliente */}
      {isEditing ? (
        <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
          {/* ... seu formulário de edição ... */}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <h1>{client.nome}</h1>
          <Button variant="outlined" onClick={() => setIsEditing(true)} sx={{ ml: 2 }}>Editar</Button>
          <Button variant="outlined" color="error" onClick={handleDelete} sx={{ ml: 1 }}>Deletar</Button>
        </Box>
      )}

      <p><strong>ID do Cliente:</strong> {client.id}</p>
      <hr style={{margin: '20px 0'}} />

      {/* Seção de Projetos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Projetos</h3>
        <Button variant="contained" onClick={() => setShowProjectForm(!showProjectForm)}>
          {showProjectForm ? 'Cancelar' : 'Adicionar Projeto'}
        </Button>
      </div>
      {showProjectForm && <NewProjectForm clienteId={client.id} onProjectAdded={handleProjectAdded} />}

      {/* AQUI ESTÁ A LÓGICA CRÍTICA QUE PRECISA SER VERIFICADA */}
      {client.projetos && client.projetos.length > 0 ? (
        <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '10px' }}>
          {client.projetos.map(projeto => {
            // Pega a flag 'is_member' que vem da API
            const isMember = projeto.is_member;

            const projectStyle = !isMember ? { 
              opacity: 0.6, 
              pointerEvents: 'none', // Impede o clique no item da lista
              background: '#f0f0f0' 
            } : {
              background: '#f9f9f9'
            };

            return (
              <li key={projeto.id} style={{ ...projectStyle, padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
                {isMember ? (
                  // Se for membro, renderiza um Link clicável
                  <Link to={`/projetos/${projeto.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <strong>{projeto.codigo_tag}</strong> - {projeto.nome_detalhado || <i>Sem nome detalhado</i>}
                  </Link>
                ) : (
                  // Se não for membro, renderiza um span não-clicável
                  <span style={{ display: 'block' }}>
                    <strong>{projeto.codigo_tag}</strong> - {projeto.nome_detalhado || <i>Sem nome detalhado</i>}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ marginTop: '10px' }}>Este cliente ainda não possui projetos.</p>
      )}
    </div>
  );
}

export default ClientDetailPage;