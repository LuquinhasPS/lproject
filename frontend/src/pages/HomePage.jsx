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
import NewClientForm from '../components/NewClientForm';
import NewProjectForm from '../components/NewProjectForm';
import ProjectCard from '../components/ProjectCard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function HomePage() {
    const [clients, setClients] = useState([]);
    const [allClientsForForm, setAllClientsForForm] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [clientMenuAnchor, setClientMenuAnchor] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [editingClientName, setEditingClientName] = useState("");
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [addingProjectToClient, setAddingProjectToClient] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [dashboardResponse, allClientsResponse] = await Promise.all([
                    apiClient.get('/clientes/'),
                    apiClient.get('/clientes/?all=true')
                ]);
                setClients(dashboardResponse.data);
                setAllClientsForForm(allClientsResponse.data);
            } catch (err) {
                setError('Não foi possível carregar os dados do dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const onDragEnd = (result) => {
        const { source, destination, draggableId, type } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
        if (type === 'COLUMN') {
            const newClientsOrder = Array.from(clients);
            const [reorderedItem] = newClientsOrder.splice(source.index, 1);
            newClientsOrder.splice(destination.index, 0, reorderedItem);
            setClients(newClientsOrder);
            return;
        }
        if (type === 'PROJECT') {
            const startClient = clients.find(c => `client-${c.id}` === source.droppableId);
            const finishClient = clients.find(c => `client-${c.id}` === destination.droppableId);
            const projectId = parseInt(draggableId.replace('project-', ''));
            if (startClient === finishClient) {
                const newProjects = Array.from(startClient.projetos);
                const [reorderedItem] = newProjects.splice(source.index, 1);
                newProjects.splice(destination.index, 0, reorderedItem);
                const newClients = clients.map(c => c.id === startClient.id ? { ...c, projetos: newProjects } : c);
                setClients(newClients);
            } else {
                const startProjects = Array.from(startClient.projetos);
                const [draggedProject] = startProjects.splice(source.index, 1);
                const finishProjects = Array.from(finishClient.projetos);
                finishProjects.splice(destination.index, 0, draggedProject);
                const newClientsState = clients.map(c => {
                    if (c.id === startClient.id) return { ...c, projetos: startProjects };
                    if (c.id === finishClient.id) return { ...c, projetos: finishProjects };
                    return c;
                });
                setClients(newClientsState);
                apiClient.patch(`/projetos/${projectId}/`, { cliente: finishClient.id });
            }
        }
    };

    const handleClientAdded = (newClient) => {
        const newClientWithProjects = { ...newClient, projetos: [] };
        setClients(current => [...current, newClientWithProjects]);
        setAllClientsForForm(current => [...current, newClient]);
        setIsClientModalOpen(false);
    };

    const handleClientMenuOpen = (event, client) => setClientMenuAnchor({ el: event.currentTarget, client: client });
    const handleClientMenuClose = () => setClientMenuAnchor(null);
    const handleOpenEditDialog = () => { setEditingClient(clientMenuAnchor.client); setEditingClientName(clientMenuAnchor.client.nome); handleClientMenuClose(); };

    const handleUpdateClient = async () => {
        if (!editingClient || !editingClientName.trim()) return;
        try {
            const response = await apiClient.patch(`/clientes/${editingClient.id}/`, { nome: editingClientName });
            const updateList = (list) => list.map(c => (c.id === editingClient.id ? { ...c, ...response.data, projetos: c.projetos } : c));
            setClients(updateList);
            setAllClientsForForm(updateList);
            setEditingClient(null);
        } catch (error) { alert("Não foi possível atualizar o cliente."); }
    };

    const handleDeleteClient = async () => {
        const clientToDelete = clientMenuAnchor.client;
        handleClientMenuClose();
        if (window.confirm(`Tem certeza que deseja deletar "${clientToDelete.nome}" e TODOS os seus projetos?`)) {
            try {
                await apiClient.delete(`/clientes/${clientToDelete.id}/`);
                setClients(current => current.filter(c => c.id !== clientToDelete.id));
                setAllClientsForForm(current => current.filter(c => c.id !== clientToDelete.id));
            } catch (error) { alert("Não foi possível deletar o cliente."); }
        }
    };

    const handleProjectAdded = (newProject) => {
        const updateList = (list) => {
            let clientExists = list.some(c => c.id === newProject.cliente);
            if (clientExists) {
                return list.map(client => client.id === newProject.cliente ? { ...client, projetos: [newProject, ...(client.projetos || [])] } : client);
            }
            const newClientData = allClientsForForm.find(c => c.id === newProject.cliente);
            return [...list, { ...newClientData, projetos: [newProject] }];
        };
        setClients(updateList(clients));
        setAllClientsForForm(currentList => updateList(currentList));
        setIsProjectModalOpen(false);
        setAddingProjectToClient(null);
    };

    const handleUpdateProject = async (projectId, newData, clientId) => {
        try {
            const response = await apiClient.patch(`/projetos/${projectId}/`, newData);
            const updateList = (list) => list.map(c => c.id === clientId ? { ...c, projetos: c.projetos.map(p => p.id === projectId ? response.data : p) } : c);
            setClients(updateList);
            setAllClientsForForm(updateList);
        } catch (error) { alert("Não foi possível atualizar o projeto."); }
    };

    const handleDeleteProject = async (projectId, clientId) => {
        if (!window.confirm("Tem certeza que deseja deletar este projeto?")) return;
        try {
            await apiClient.delete(`/projetos/${projectId}/`);
            const updateList = (list) => list.map(c => c.id === clientId ? { ...c, projetos: c.projetos.filter(p => p.id !== projectId) } : c);
            setClients(updateList);
            setAllClientsForForm(updateList);
        } catch (error) { alert("Não foi possível deletar o projeto."); }
    };

    const handleTaskAdd = (newTask, projectId) => {
        const updateList = (list) => list.map(c => ({
            ...c,
            projetos: c.projetos.map(p => p.id === projectId ? { ...p, tarefas: [...(p.tarefas || []), newTask] } : p)
        }));
        setClients(updateList);
        setAllClientsForForm(updateList);
    };

    const handleDeleteTask = async (taskId, projectId) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await apiClient.delete(`/tarefas/${taskId}/`);
            const updateList = (list) => list.map(client => ({
                ...client,
                projetos: client.projetos.map(p => {
                    if (p.id === projectId) {
                        return { ...p, tarefas: p.tarefas.filter(t => t.id !== taskId && t.tarefa_pai !== taskId) };
                    }
                    return p;
                })
            }));
            setClients(updateList);
            setAllClientsForForm(updateList);
        } catch (error) { alert("Não foi possível deletar a tarefa."); }
    };

    const handleEditTask = async (taskId, newDescription, projectId) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskId}/`, { descricao: newDescription });
            const updatedTask = response.data;
            const updateList = (list) => list.map(client => ({
                ...client,
                projetos: client.projetos.map(p => p.id === projectId ? { ...p, tarefas: p.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t) } : p)
            }));
            setClients(updateList);
            setAllClientsForForm(updateList);
        } catch (error) { alert("Não foi possível editar a tarefa."); }
    };

    const handleToggleTask = async (taskToToggle) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskToToggle.id}/`, { concluida: !taskToToggle.concluida });
            const updatedTask = response.data;
            const updateList = (list) => list.map(client => ({
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
            }));
            setClients(updateList);
            setAllClientsForForm(updateList);
        } catch (error) { console.error("Erro ao dar toggle na tarefa:", error); }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Dashboard de Projetos</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" onClick={() => setIsClientModalOpen(true)}>Adicionar Cliente</Button>
                        <Button variant="contained" onClick={() => setIsProjectModalOpen(true)}>Novo Projeto</Button>
                    </Box>
                </Box>
                
                <Droppable droppableId="all-clients" direction="horizontal" type="COLUMN">
                    {(provided) => (
                        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: 2, p: 1, mt: 2, alignItems: 'flex-start', height: 'calc(100vh - 150px)' }}>
                            {clients.map((client, index) => (
                                <Draggable key={client.id} draggableId={`client-col-${client.id}`} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} style={{...provided.draggableProps.style}}>
                                            <Paper elevation={3} sx={{ minWidth: '340px', width: '340px', backgroundColor: '#f4f5f7', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, cursor: 'grab' }} {...provided.dragHandleProps}>
                                                    <Typography variant="h6" sx={{ p: 1 }}>{client.nome}</Typography>
                                                    <Box>
                                                        <Tooltip title="Adicionar Projeto a este Cliente"><IconButton size="small" onClick={() => setAddingProjectToClient(client.id)}><AddIcon /></IconButton></Tooltip>
                                                        <IconButton size="small" onClick={(e) => handleClientMenuOpen(e, client)}><MoreVertIcon /></IconButton>
                                                    </Box>
                                                </Box>
                                                <Droppable droppableId={`client-${client.id}`} type="PROJECT">
                                                    {(providedDrop) => (
                                                        <Box ref={providedDrop.innerRef} {...providedDrop.droppableProps} sx={{ overflowY: 'auto', flexGrow: 1, p: 1, minHeight: '100px' }}>
                                                            {client.projetos?.map((project, projIndex) => (
                                                                <Draggable key={project.id} draggableId={`project-${project.id}`} index={projIndex}>
                                                                    {(providedDrag) => (
                                                                        <div ref={providedDrag.innerRef} {...providedDrag.draggableProps} {...providedDrag.dragHandleProps}>
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
                                                            {providedDrop.placeholder}
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
                    <MenuItem onClick={handleOpenEditDialog}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar Nome</MenuItem>
                    <MenuItem onClick={handleDeleteClient} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar Cliente</MenuItem>
                </Menu>

                <Dialog open={Boolean(editingClient)} onClose={() => setEditingClient(null)} fullWidth>
                    <DialogTitle>Editar Nome do Cliente</DialogTitle>
                    <DialogContent><TextField autoFocus margin="dense" label="Nome do Cliente" type="text" fullWidth variant="standard" value={editingClientName} onChange={(e) => setEditingClientName(e.target.value)} /></DialogContent>
                    <DialogActions><Button onClick={() => setEditingClient(null)}>Cancelar</Button><Button onClick={handleUpdateClient} variant="contained">Salvar</Button></DialogActions>
                </Dialog>

                <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <DialogContent><NewClientForm onClientAdded={handleClientAdded} onCancel={() => setIsClientModalOpen(false)} /></DialogContent>
                </Dialog>
                
                {/* DIALOG PRINCIPAL DE NOVO PROJETO */}
                <Dialog open={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Adicionar Novo Projeto</DialogTitle>
                    <DialogContent>
                        {/* AQUI ESTÁ A CORREÇÃO: Passa 'allClientsForForm' */}
                        <NewProjectForm clients={allClientsForForm} onProjectAdded={handleProjectAdded} onCancel={() => setIsProjectModalOpen(false)} />
                    </DialogContent>
                </Dialog>
                
                {/* DIALOG PARA O BOTÃO '+' DENTRO DA COLUNA */}
                <Dialog open={Boolean(addingProjectToClient)} onClose={() => setAddingProjectToClient(null)} fullWidth maxWidth="sm">
                    <DialogTitle>Novo Projeto para {clients.find(c => c.id === addingProjectToClient)?.nome}</DialogTitle>
                    <DialogContent>
                        <NewProjectForm clienteId={addingProjectToClient} onProjectAdded={handleProjectAdded} onCancel={() => setAddingProjectToClient(null)} />
                    </DialogContent>
                </Dialog>
            </div>
        </DragDropContext>
    );
}

export default HomePage;