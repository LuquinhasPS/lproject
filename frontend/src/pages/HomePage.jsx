// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { CircularProgress, Typography, Alert, Box, Button } from '@mui/material';
import NewProjectForm from '../components/NewProjectForm';
import ProjectCard from '../components/ProjectCard';

function HomePage() {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProjectForm, setShowProjectForm] = useState(false);

useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // A versão original e correta, que busca tudo em paralelo
            const [projectsResponse, clientsResponse] = await Promise.all([
                apiClient.get('/projetos/'),
                apiClient.get('/clientes/')
            ]);
            setProjects(projectsResponse.data);
            setClients(clientsResponse.data);
        } catch (err) {
            setError('Não foi possível carregar os dados do dashboard.');
            console.error("Erro detalhado no fetchData:", err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, []); // Array de dependência vazio para rodar apenas uma vez

    const updateProjectInState = (updatedProject) => {
        setProjects(currentProjects =>
            currentProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
    };

    // --- FUNÇÕES DE MANIPULAÇÃO SEPARADAS E EXPLÍCITAS ---

    const handleToggleTask = async (taskToToggle) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskToToggle.id}/`, { concluida: !taskToToggle.concluida });
            const updatedTask = response.data;
            setProjects(currentProjects =>
                currentProjects.map(p => {
                    if (p.id === updatedTask.projeto) {
                        const newTasks = p.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t);
                        // Lógica de cascata para a UI
                        const getAllDescendantIds = (taskId, tasks) => {
                            let ids = [];
                            const children = tasks.filter(t => t.tarefa_pai === taskId);
                            for (const child of children) {
                                ids.push(child.id);
                                ids = ids.concat(getAllDescendantIds(child.id, tasks));
                            }
                            return ids;
                        };
                        const descendantIds = getAllDescendantIds(updatedTask.id, newTasks);
                        const idsToUpdate = [updatedTask.id, ...descendantIds];
                        const finalTasks = newTasks.map(t => idsToUpdate.includes(t.id) ? { ...t, concluida: updatedTask.concluida } : t);
                        
                        return { ...p, tarefas: finalTasks };
                    }
                    return p;
                })
            );
        } catch (error) {
            console.error("Erro ao dar toggle na tarefa:", error);
        }
    };

    const handleEditTask = async (taskId, newDescription, projectId) => {
        try {
            const response = await apiClient.patch(`/tarefas/${taskId}/`, { descricao: newDescription });
            const updatedTask = response.data;
             setProjects(currentProjects =>
                currentProjects.map(p => {
                    if (p.id === projectId) {
                        const newTasks = p.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t);
                        return { ...p, tarefas: newTasks };
                    }
                    return p;
                })
            );
        } catch (error) {
            console.error("Erro ao editar a tarefa:", error);
        }
    };

    const handleTaskDelete = async (taskId, projectId) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await apiClient.delete(`/tarefas/${taskId}/`);
            setProjects(currentProjects =>
                currentProjects.map(p => {
                    if (p.id === projectId) {
                        return { ...p, tarefas: p.tarefas.filter(t => t.id !== taskId) };
                    }
                    return p;
                })
            );
        } catch (error) {
            console.error("Erro ao deletar a tarefa:", error);
        }
    };

    const handleTaskAdd = (newTask, projectId) => {
        setProjects(currentProjects =>
            currentProjects.map(p => {
                if (p.id === projectId) {
                    const existingTasks = p.tarefas || [];
                    return { ...p, tarefas: [...existingTasks, newTask] };
                }
                return p;
            })
        );
    };

    const handleProjectAdded = (newProject) => {
        setProjects(currentProjects => [newProject, ...currentProjects]);
        setShowProjectForm(false);
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <div>
            {/* ... seu JSX do cabeçalho ... */}
            <Box sx={{ mt: 4 }}>
                {projects.length > 0 ? projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        // Passando as novas funções explícitas
                        onTaskToggle={handleToggleTask}
                        onTaskEdit={handleEditTask}
                        onTaskDelete={handleTaskDelete}
                        onTaskAdd={handleTaskAdd}
                    />
                )) : (
                    <Typography>Você ainda não participa de nenhum projeto.</Typography>
                )}
            </Box>
        </div>
    );
}

export default HomePage;