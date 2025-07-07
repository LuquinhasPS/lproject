// frontend/src/pages/ProjectDetailPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import {
    CircularProgress, Typography, Alert, Box, List,
    ListItem, ListItemIcon, ListItemText, Checkbox, IconButton, Button, TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import NewTaskForm from '../components/NewTaskForm';

function ProjectDetailPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/projetos/${projectId}/`);
                setProject(response.data);
            } catch (err) {
                setError('Não foi possível carregar os dados do projeto.');
            } finally {
                setLoading(false);
            }
        };
        fetchProjectDetails();
    }, [projectId]);

    const onTaskUpdated = (updatedTask) => {
        setProject(currentProject => ({
            ...currentProject,
            tarefas: currentProject.tarefas.map(t => t.id === updatedTask.id ? updatedTask : t)
        }));
    };

    const handleTaskAdded = (newTask) => {
        setProject(currentProject => ({
            ...currentProject,
            tarefas: [...currentProject.tarefas, newTask],
        }));
        setShowTaskForm(false);
        setReplyingTo(null);
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Tem certeza que deseja deletar esta tarefa?")) {
            try {
                await apiClient.delete(`/tarefas/${taskId}/`);
                setProject(currentProject => ({
                    ...currentProject,
                    tarefas: currentProject.tarefas.filter(task => task.id !== taskId),
                }));
            } catch (error) {
                console.error("Erro ao deletar a tarefa:", error);
            }
        }
    };
    
    // ESTA É A FUNÇÃO PRINCIPAL QUE CONTÉM A LÓGICA DE CASCATA
    const handleToggleTask = async (taskToToggle) => {
        const novoStatus = !taskToToggle.concluida;

        // Função auxiliar para encontrar todos os IDs de descendentes
        const getAllDescendantIds = (taskId, tasks) => {
            let ids = [];
            const children = tasks.filter(t => t.tarefa_pai === taskId);
            for (const child of children) {
                ids.push(child.id);
                ids = ids.concat(getAllDescendantIds(child.id, tasks));
            }
            return ids;
        };

        try {
            // A requisição para a API continua a mesma, apenas para a tarefa pai
            await apiClient.patch(`/tarefas/${taskToToggle.id}/`, {
                concluida: novoStatus,
            });

            // ATUALIZA O ESTADO LOCAL EM CASCATA
            setProject(currentProject => {
                const tasks = currentProject.tarefas;
                const descendantIds = getAllDescendantIds(taskToToggle.id, tasks);
                const idsToUpdate = [taskToToggle.id, ...descendantIds];

                const updatedTasks = tasks.map(task =>
                    idsToUpdate.includes(task.id) ? { ...task, concluida: novoStatus } : task
                );
                
                return { ...currentProject, tarefas: updatedTasks };
            });

        } catch (error) {
            console.error("Erro ao atualizar a tarefa:", error);
            alert('Não foi possível atualizar o status da tarefa.');
        }
    };

    const taskTree = useMemo(() => {
        if (!project?.tarefas) return [];
        const taskMap = new Map(project.tarefas.map(task => [task.id, { ...task, children: [] }]));
        const tree = [];
        project.tarefas.forEach(task => {
            if (task.tarefa_pai) {
                const parent = taskMap.get(task.tarefa_pai);
                if (parent) {
                    parent.children.push(taskMap.get(task.id));
                }
            } else {
                tree.push(taskMap.get(task.id));
            }
        });
        tree.sort((a,b) => a.concluida - b.concluida);
        return tree;
    }, [project?.tarefas]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!project) return <Typography>Nenhum projeto encontrado.</Typography>;

    const TaskItem = ({ task, level = 0 }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editText, setEditText] = useState(task.descricao);

        const handleUpdate = async () => {
            if (editText.trim() === '') return;
            try {
                const response = await apiClient.patch(`/tarefas/${task.id}/`, { descricao: editText });
                onTaskUpdated(response.data);
                setIsEditing(false);
            } catch (error) {
                alert("Não foi possível salvar a alteração.");
            }
        };

        return (
            <>
                <ListItem style={{ paddingLeft: `${level * 24 + 16}px` }} secondaryAction={
                    isEditing ? (
                        <>
                            <IconButton edge="end" onClick={handleUpdate}><SaveIcon /></IconButton>
                            <IconButton edge="end" onClick={() => setIsEditing(false)}><CancelIcon /></IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton edge="end" title="Adicionar Subtarefa" onClick={() => setReplyingTo(task.id)}><AddCircleOutlineIcon /></IconButton>
                            <IconButton edge="end" title="Editar Tarefa" onClick={() => setIsEditing(true)}><EditIcon /></IconButton>
                            <IconButton edge="end" title="Deletar Tarefa" onClick={() => handleDeleteTask(task.id)}><DeleteIcon /></IconButton>
                        </>
                    )
                }>
                    <ListItemIcon>
                        {/* O Checkbox agora chama a função do componente pai, passando a tarefa inteira */}
                        <Checkbox edge="start" checked={task.concluida} onChange={() => handleToggleTask(task)} />
                    </ListItemIcon>
                    {isEditing ? (
                        <TextField value={editText} onChange={(e) => setEditText(e.target.value)} variant="standard" fullWidth autoFocus onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}/>
                    ) : (
                        <ListItemText primary={task.descricao} style={{ textDecoration: task.concluida ? 'line-through' : 'none', color: task.concluida ? 'grey' : 'inherit' }} />
                    )}
                </ListItem>
                {replyingTo === task.id && (
                    <Box style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                        <NewTaskForm parentId={task.id} onTaskAdded={handleTaskAdded} onCancel={() => setReplyingTo(null)} />
                    </Box>
                )}
                {task.children?.length > 0 && (
                    <List component="div" disablePadding>
                        {task.children.sort((a,b) => a.concluida - b.concluida).map(child => <TaskItem key={child.id} task={child} level={level + 1} />)}
                    </List>
                )}
            </>
        );
    };

    return (
        <div>
            <Link to="/clientes"><Button sx={{ mb: 2 }}>&larr; Voltar para Clientes</Button></Link>
            <Typography variant="h4" gutterBottom>{project.codigo_tag}</Typography>
            <Typography variant="subtitle1" color="text.secondary">{project.nome_detalhado}</Typography>
            <hr style={{margin: '20px 0'}} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Tarefas do Projeto</Typography>
                <Button variant="contained" onClick={() => setShowTaskForm(!showTaskForm)}>
                    {showTaskForm ? 'Cancelar' : 'Nova Tarefa'}
                </Button>
            </Box>
            {showTaskForm && <NewTaskForm projectId={project.id} onTaskAdded={handleTaskAdded} onCancel={() => setShowTaskForm(false)} />}
            
            {taskTree.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', mt: 2 }}>
                    {taskTree.map(task => <TaskItem key={task.id} task={task} />)}
                </List>
            ) : (
                !showTaskForm && <Typography sx={{ mt: 2 }}>Este projeto ainda não possui tarefas.</Typography>
            )}
        </div>
    );
}

export default ProjectDetailPage;