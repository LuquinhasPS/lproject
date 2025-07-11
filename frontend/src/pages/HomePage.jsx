// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
    CircularProgress, Typography, Alert, Box, Button, Paper, IconButton,
    Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NewProjectForm from '../components/NewProjectForm';
import NewClientForm from '../components/NewClientForm';
import ProjectCard from '../components/ProjectCard';


function HomePage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [addingProjectToClient, setAddingProjectToClient] = useState(null);
    const [clientMenuAnchor, setClientMenuAnchor] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [editingClientName, setEditingClientName] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const clientsResponse = await apiClient.get('/clientes/');
                setClients(clientsResponse.data);
            } catch (err) {
                setError('Não foi possível carregar os dados do dashboard.');
                console.error("Erro detalhado no fetchData:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleClientAdded = (newClient) => {
        setClients(currentClients => [...currentClients, { ...newClient, projetos: [] }]);
        setIsClientModalOpen(false);
    };

    const handleProjectAdded = (newProject) => {
        setClients(currentClients =>
            currentClients.map(client => {
                if (client.id === newProject.cliente) {
                    return { ...client, projetos: [newProject, ...(client.projetos || [])] };
                }
                return client;
            })
        );
        setAddingProjectToClient(null);
    };

    // --- NOVAS FUNÇÕES HANDLER PARA CLIENTES ---
    // --- NOVAS FUNÇÕES PARA PROJETOS ---
    const handleDeleteProject = async (projectId, clientId) => {
        if (!window.confirm("Tem certeza que deseja deletar este projeto?")) return;
        try {
            await apiClient.delete(`/projetos/${projectId}/`);
            setClients(currentClients =>
                currentClients.map(c => {
                    if (c.id === clientId) {
                        return { ...c, projetos: c.projetos.filter(p => p.id !== projectId) };
                    }
                    return c;
                })
            );
        } catch (error) {
            console.error("Erro ao deletar projeto:", error);
            alert("Não foi possível deletar o projeto.");
        }
    };

    const handleUpdateProject = async (projectId, newData, clientId) => {
        try {
            const response = await apiClient.patch(`/projetos/${projectId}/`, newData);
            setClients(currentClients =>
                currentClients.map(c => {
                    if (c.id === clientId) {
                        return { ...c, projetos: c.projetos.map(p => p.id === projectId ? response.data : p) };
                    }
                    return c;
                })
            );
        } catch (error) {
            console.error("Erro ao atualizar projeto:", error);
            alert("Não foi possível atualizar o projeto.");
        }
    };
    const handleClientMenuOpen = (event, client) => {
        setClientMenuAnchor({ el: event.currentTarget, client: client });
    };

    const handleClientMenuClose = () => {
        setClientMenuAnchor(null);
    };

    const handleOpenEditDialog = () => {
        setEditingClient(clientMenuAnchor.client);
        setEditingClientName(clientMenuAnchor.client.nome);
        handleClientMenuClose();
    };

    const handleUpdateClient = async () => {
        if (!editingClient || !editingClientName.trim()) return;
        try {
            const response = await apiClient.patch(`/clientes/${editingClient.id}/`, { nome: editingClientName });
            setClients(currentClients => 
                currentClients.map(c => c.id === editingClient.id ? response.data : c)
            );
            setEditingClient(null);
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            alert("Não foi possível atualizar o nome do cliente.");
        }
    };

    const handleDeleteClient = async () => {
        const clientToDelete = clientMenuAnchor.client;
        handleClientMenuClose();
        if (window.confirm(`Tem certeza que deseja deletar o cliente "${clientToDelete.nome}"? TODOS os seus projetos e tarefas serão perdidos.`)) {
            try {
                await apiClient.delete(`/clientes/${clientToDelete.id}/`);
                setClients(currentClients => currentClients.filter(c => c.id !== clientToDelete.id));
            } catch (error) {
                console.error("Erro ao deletar cliente:", error);
                alert("Não foi possível deletar o cliente.");
            }
        }
    };


    // Mantém as funções de tarefas do seu projeto
    const handleTaskAdd = (newTask, projectId) => {
        setClients(currentClients =>
            currentClients.map(client => ({
                ...client,
                projetos: client.projetos.map(p => {
                    if (p.id === projectId) {
                        return { ...p, tarefas: [...(p.tarefas || []), newTask] };
                    }
                    return p;
                })
            }))
        );
    };

    const handleDeleteTask = async (taskId, projectId) => {
        if (!window.confirm("Tem certeza que deseja deletar esta tarefa?")) return;
        try {
            await apiClient.delete(`/tarefas/${taskId}/`);
            setClients(currentClients =>
                currentClients.map(client => ({
                    ...client,
                    projetos: client.projetos.map(p => {
                        if (p.id === projectId) {
                            return { ...p, tarefas: p.tarefas.filter(t => t.id !== taskId && t.tarefa_pai !== taskId) };
                        }
                        return p;
                    })
                }))
            );
        } catch (error) {
            console.error("Erro ao deletar a tarefa:", error);
            alert("Não foi possível deletar a tarefa.");
        }
    };

    const handleToggleTask = async (taskToToggle) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskToToggle.id}/`, { concluida: !taskToToggle.concluida });
            const updatedTask = response.data;
            setClients(currentClients => currentClients.map(client => ({
                ...client,
                projetos: client.projetos.map(p => {
                    if (p.id === updatedTask.projeto) {
                        let newTasks = p.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t);
                        const getAllDescendantIds = (taskId, tasks) => {
                            let ids = [];
                            tasks.filter(t => t.tarefa_pai === taskId).forEach(child => {
                                ids.push(child.id);
                                ids = ids.concat(getAllDescendantIds(child.id, tasks));
                            });
                            return ids;
                        };
                        const descendantIds = getAllDescendantIds(updatedTask.id, newTasks);
                        const idsToUpdate = [updatedTask.id, ...descendantIds];
                        newTasks = newTasks.map(t => idsToUpdate.includes(t.id) ? { ...t, concluida: updatedTask.concluida } : t);
                        return { ...p, tarefas: newTasks };
                    }
                    return p;
                })
            })));
        } catch (error) {
            console.error("Erro ao dar toggle na tarefa:", error);
        }
    };

    const handleEditTask = async (taskId, newDescription, projectId) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskId}/`, { descricao: newDescription });
            const updatedTask = response.data;
             setClients(currentClients => currentClients.map(client => ({
                ...client,
                projetos: client.projetos.map(p => {
                    if (p.id === projectId) {
                        return { ...p, tarefas: p.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t) };
                    }
                    return p;
                })
            })));
        } catch (error) {
            console.error("Erro ao editar a tarefa:", error);
            alert("Não foi possível editar a tarefa.");
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Dashboard de Projetos</Typography>
                <Button variant="contained" onClick={() => setIsClientModalOpen(true)}>
                    Adicionar Cliente
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: 2, p: 1, mt: 2, height: 'calc(100vh - 200px)' }}>
                {clients.map(client => (
                    <Paper key={client.id} elevation={3} sx={{ minWidth: '320px', maxWidth: '320px', p: 1, backgroundColor: '#f4f5f7', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                            <Typography variant="h6">{client.nome}</Typography>
                            <Box>
                                <Tooltip title="Adicionar Novo Projeto">
                                    <IconButton size="small" onClick={() => setAddingProjectToClient(client.id)}>
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                                <IconButton size="small" onClick={(e) => handleClientMenuOpen(e, client)}>
                                    <MoreVertIcon />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
                            {client.projetos && client.projetos.length > 0 ? client.projetos.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onTaskToggle={handleToggleTask}
                                    onTaskEdit={handleEditTask}
                                    onTaskDelete={handleDeleteTask}
                                    onTaskAdd={handleTaskAdd}
                                    onProjectDelete={() => handleDeleteProject(project.id, client.id)}
                                    onProjectUpdate={(newData) => handleUpdateProject(project.id, newData, client.id)}
                                />
                            )) : (
                                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>Nenhum projeto.</Typography>
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* MENU DE OPÇÕES DO CLIENTE */}
            <Menu
                anchorEl={clientMenuAnchor?.el}
                open={Boolean(clientMenuAnchor)}
                onClose={handleClientMenuClose}
            >
                <MenuItem onClick={handleOpenEditDialog}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Editar Nome
                </MenuItem>
                <MenuItem onClick={handleDeleteClient} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error"/></ListItemIcon>
                    Deletar Cliente
                </MenuItem>
            </Menu>

            {/* POP-UP PARA ADICIONAR NOVO CLIENTE */}
            <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogContent>
                    <NewClientForm onClientAdded={handleClientAdded} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsClientModalOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            {/* POP-UP PARA ADICIONAR NOVO PROJETO */}
            <Dialog open={Boolean(addingProjectToClient)} onClose={() => setAddingProjectToClient(null)}>
                <DialogTitle>Adicionar Novo Projeto</DialogTitle>
                <DialogContent>
                    <NewProjectForm
                        clienteId={addingProjectToClient}
                        onProjectAdded={handleProjectAdded}
                        onCancel={() => setAddingProjectToClient(null)}
                    />
                </DialogContent>
            </Dialog>

            {/* DIALOG PARA EDITAR CLIENTE */}
            <Dialog open={Boolean(editingClient)} onClose={() => setEditingClient(null)}>
                <DialogTitle>Editar Nome do Cliente</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome do Cliente"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={editingClientName}
                        onChange={(e) => setEditingClientName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingClient(null)}>Cancelar</Button>
                    <Button onClick={handleUpdateClient} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
export default HomePage;