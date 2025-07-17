// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
    CircularProgress, Typography, Alert, Box, Paper, IconButton,
    Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Button, Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import NewProjectForm from '../components/NewProjectForm';
import NewClientForm from '../components/NewClientForm';
import ProjectCard from '../components/ProjectCard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function HomePage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientMenuAnchor, setClientMenuAnchor] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [editingClientName, setEditingClientName] = useState("");
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [addingProjectToClient, setAddingProjectToClient] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const clientsResponse = await apiClient.get('/clientes/');
                setClients(clientsResponse.data);
            } catch (err) {
                setError('Não foi possível carregar os dados do dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const projectId = parseInt(draggableId.replace('project-', ''));
        const sourceClientId = parseInt(source.droppableId.replace('client-', ''));
        const destinationClientId = parseInt(destination.droppableId.replace('client-', ''));
        let draggedProject;

        const newClients = [...clients];
        const sourceClient = newClients.find(c => c.id === sourceClientId);
        const destinationClient = newClients.find(c => c.id === destinationClientId);

        if (source.droppableId === destination.droppableId) {
            const reorderedProjects = Array.from(sourceClient.projetos);
            const [movedItem] = reorderedProjects.splice(source.index, 1);
            reorderedProjects.splice(destination.index, 0, movedItem);
            sourceClient.projetos = reorderedProjects;
        } else {
            const sourceProjects = Array.from(sourceClient.projetos);
            [draggedProject] = sourceProjects.splice(source.index, 1);
            const destinationProjects = Array.from(destinationClient.projetos);
            destinationProjects.splice(destination.index, 0, draggedProject);
            sourceClient.projetos = sourceProjects;
            destinationClient.projetos = destinationProjects;
            apiClient.patch(`/projetos/${projectId}/`, { cliente: destinationClientId }).catch(() => alert("Erro ao salvar a mudança."));
        }
        setClients(newClients);
    };

    const handleClientAdded = (newClient) => { setClients(c => [...c, { ...newClient, projetos: [] }]); setIsClientModalOpen(false); };
    const handleClientMenuOpen = (event, client) => { setClientMenuAnchor({ el: event.currentTarget, client: client }); };
    const handleClientMenuClose = () => setClientMenuAnchor(null);
    const handleOpenEditDialog = () => { setEditingClient(clientMenuAnchor.client); setEditingClientName(clientMenuAnchor.client.nome); handleClientMenuClose(); };
    
    const handleUpdateClient = async () => {
        if (!editingClient || !editingClientName.trim()) return;
        try {
            const response = await apiClient.patch(`/clientes/${editingClient.id}/`, { nome: editingClientName });
            setClients(currentClients => currentClients.map(c => (c.id === editingClient.id ? { ...c, ...response.data, projetos: c.projetos } : c)));
            setEditingClient(null);
        } catch (error) { alert("Não foi possível atualizar o cliente."); }
    };

    const handleDeleteClient = async () => {
        const clientToDelete = clientMenuAnchor.client;
        handleClientMenuClose();
        if (window.confirm(`Tem certeza que deseja deletar "${clientToDelete.nome}" e TODOS os seus projetos?`)) {
            try {
                await apiClient.delete(`/clientes/${clientToDelete.id}/`);
                setClients(currentClients => currentClients.filter(c => c.id !== clientToDelete.id));
            } catch (error) { alert("Não foi possível deletar o cliente."); }
        }
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

    const handleUpdateProject = async (projectId, newData, clientId) => {
        try {
            const response = await apiClient.patch(`/projetos/${projectId}/`, newData);
            setClients(currentClients => currentClients.map(c => {
                if (c.id === clientId) {
                    return { ...c, projetos: c.projetos.map(p => p.id === projectId ? response.data : p) };
                }
                return c;
            }));
        } catch (error) { alert("Não foi possível atualizar o projeto."); }
    };

    const handleDeleteProject = async (projectId, clientId) => {
        if (!window.confirm("Tem certeza que deseja deletar este projeto?")) return;
        try {
            await apiClient.delete(`/projetos/${projectId}/`);
            setClients(currentClients => currentClients.map(c => {
                if (c.id === clientId) {
                    return { ...c, projetos: c.projetos.filter(p => p.id !== projectId) };
                }
                return c;
            }));
        } catch (error) { alert("Não foi possível deletar o projeto."); }
    };

    const handleTaskAdd = (newTask, projectId) => {
        setClients(currentClients => currentClients.map(c => ({
            ...c,
            projetos: c.projetos.map(p => p.id === projectId ? { ...p, tarefas: [...(p.tarefas || []), newTask] } : p)
        })));
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
                            tasks.filter(t => t.tarefa_pai === taskId).forEach(child => { ids.push(child.id); ids = ids.concat(getAllDescendantIds(child.id, tasks)); });
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
        } catch (error) { console.error("Erro ao dar toggle na tarefa:", error); }
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
        } catch (error) { console.error("Erro ao editar a tarefa:", error); }
    };

// Em frontend/src/pages/HomePage.jsx

const handleDeleteTask = async (taskId, projectId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta tarefa?")) return;
    try {
        await apiClient.delete(`/tarefas/${taskId}/`);

        setClients(currentClients =>
            currentClients.map(client => ({
                ...client,
                // Mapeia cada projeto dentro de cada cliente
                projetos: client.projetos.map(p => {
                    // Se este não for o projeto da tarefa deletada, não faz nada
                    if (p.id !== projectId) {
                        return p;
                    }

                    // Se for o projeto correto, retorna o projeto com a lista de tarefas filtrada
                    // A CORREÇÃO ESTÁ AQUI: (p.tarefas || []) garante que nunca chamaremos .filter() em undefined
                    const updatedTasks = (p.tarefas || []).filter(t => t.id !== taskId && t.tarefa_pai !== taskId);
                    
                    return { ...p, tarefas: updatedTasks };
                })
            }))
        );
    } catch (error) {
        console.error("Erro ao deletar a tarefa:", error);
        alert("Não foi possível deletar a tarefa.");
    }
};

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Dashboard de Projetos</Typography>
                    <Button variant="contained" onClick={() => setIsClientModalOpen(true)}>Adicionar Cliente</Button>
                </Box>
                <Droppable droppableId="all-clients" direction="horizontal" type="COLUMN">
                    {(provided) => (
                        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: 2, p: 1, mt: 2, alignItems: 'flex-start', height: 'calc(100vh - 150px)' }}>
                            {clients.map((client, index) => (
                                <Draggable key={client.id} draggableId={`client-col-${client.id}`} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} style={{ ...provided.draggableProps.style }}>
                                            <Paper elevation={3} sx={{ minWidth: '340px', width: '340px', backgroundColor: '#f4f5f7', display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }} {...provided.dragHandleProps}>
                                                    <Typography variant="h6" sx={{ p: 1 }}>{client.nome}</Typography>
                                                    <Tooltip title="Adicionar Novo Projeto"><IconButton size="small" onClick={() => setAddingProjectToClient(client.id)}><AddIcon /></IconButton></Tooltip>
                                                    <IconButton size="small" onClick={(e) => handleClientMenuOpen(e, client)}><MoreVertIcon /></IconButton>
                                                </Box>
                                                <Droppable droppableId={`client-${client.id}`} type="PROJECT">
                                                    {(provided) => (
                                                        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ overflowY: 'auto', flexGrow: 1, p: 1, minHeight: '100px' }}>
                                                            {client.projetos?.map((project, projIndex) => (
                                                                <Draggable key={project.id} draggableId={`project-${project.id}`} index={projIndex}>
                                                                    {(provided, snapshot) => (
                                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, boxShadow: snapshot.isDragging ? '0px 4px 8px rgba(0,0,0,0.2)' : 'none' }}>
                                                                            {/* --- AQUI ESTÁ A CORREÇÃO --- */}
                                                                            <ProjectCard
                                                                                project={project}
                                                                                onProjectUpdate={(newData) => handleUpdateProject(project.id, newData, client.id)}
                                                                                onProjectDelete={() => handleDeleteProject(project.id, client.id)}
                                                                                onTaskToggle={handleToggleTask}
                                                                                onTaskEdit={handleEditTask}
                                                                                onTaskDelete={handleDeleteTask}
                                                                                onTaskAdd={handleTaskAdd}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </Box>
                                                    )}
                                                </Droppable>
                                            </Paper>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Box>
                    )}
                </Droppable>
                
                <Menu anchorEl={clientMenuAnchor?.el} open={Boolean(clientMenuAnchor)} onClose={handleClientMenuClose}>
                    <MenuItem onClick={handleOpenEditDialog}>Editar Nome</MenuItem>
                    <MenuItem onClick={handleDeleteClient} sx={{ color: 'error.main' }}>Deletar Cliente</MenuItem>
                </Menu>

                <Dialog open={Boolean(editingClient)} onClose={() => setEditingClient(null)}>
                    <DialogTitle>Editar Nome do Cliente</DialogTitle>
                    <DialogContent><TextField autoFocus margin="dense" label="Nome" type="text" fullWidth variant="standard" value={editingClientName} onChange={(e) => setEditingClientName(e.target.value)} /></DialogContent>
                    <DialogActions><Button onClick={() => setEditingClient(null)}>Cancelar</Button><Button onClick={handleUpdateClient}>Salvar</Button></DialogActions>
                </Dialog>

                <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <DialogContent><NewClientForm onClientAdded={handleClientAdded} onCancel={() => setIsClientModalOpen(false)} /></DialogContent>
                </Dialog>

                <Dialog open={Boolean(addingProjectToClient)} onClose={() => setAddingProjectToClient(null)}>
                    <DialogTitle>Adicionar Novo Projeto</DialogTitle>
                    <DialogContent><NewProjectForm clienteId={addingProjectToClient} clients={clients} onProjectAdded={handleProjectAdded} onCancel={() => setAddingProjectToClient(null)} /></DialogContent>
                </Dialog>
            </div>
        </DragDropContext>
    );
}

export default HomePage;