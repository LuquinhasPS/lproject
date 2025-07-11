// frontend/src/components/ProjectCard.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Card, CardContent, CardActionArea, Box, Typography, List, ListItem,
    ListItemIcon, ListItemText, Checkbox, IconButton, Button, TextField, Chip,
    Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import NewTaskForm from './NewTaskForm';
import { getPriorityInfo } from '../utils/priority';

// As props recebidas da HomePage
function ProjectCard({ project, onTaskToggle, onTaskEdit, onTaskDelete, onTaskAdd, onProjectDelete, onProjectUpdate }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const projectPriorityInfo = getPriorityInfo(project.data_prazo);
    // --- NOVOS STATES PARA O MENU E EDIÇÃO DO PROJETO ---
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        codigo_tag: project.codigo_tag,
        nome_detalhado: project.nome_detalhado
    });

    // --- LÓGICA PARA OS NOVOS BALÕES DE INFORMAÇÃO ---
    const projectStats = useMemo(() => {
        if (!project.tarefas || project.tarefas.length === 0) {
            return { completedTasks: 0, totalTasks: 0, nearestDeadline: null };
        }
        const completedTasks = project.tarefas.filter(t => t.concluida).length;
        const totalTasks = project.tarefas.length;
        const upcomingDeadlines = project.tarefas
            .filter(t => !t.concluida && t.data_prazo)
            .map(t => new Date(t.data_prazo));
        const nearestDeadline = upcomingDeadlines.length > 0
            ? new Date(Math.min.apply(null, upcomingDeadlines))
            : null;
        return { completedTasks, totalTasks, nearestDeadline };
    }, [project.tarefas]);
    const nearestDeadlineInfo = getPriorityInfo(projectStats.nearestDeadline);
    // --- Funções do menu de projeto ---
    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => setMenuAnchorEl(null);
    const handleEditClick = () => {
        setIsEditing(true);
        handleMenuClose();
    };
    const handleDeleteClick = () => {
        onProjectDelete();
        handleMenuClose();
    };
    const handleUpdateProject = () => {
        onProjectUpdate(editData);
        setIsEditing(false);
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
        tree.sort((a, b) => a.concluida - b.concluida);
        return tree;
    }, [project?.tarefas]);

    const handleTaskAdded = (newTask) => {
        onTaskAdd(newTask, project.id);
        setReplyingTo(null);
        setIsModalOpen(false);
    };

    // Componente interno para renderizar cada tarefa
    const TaskItem = ({ task, level = 0 }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editText, setEditText] = useState(task.descricao);
        const taskPriorityInfo = getPriorityInfo(task.data_prazo);
        const [anchorEl, setAnchorEl] = useState(null);
        const isMenuOpen = Boolean(anchorEl);

        const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
        const handleMenuClose = () => setAnchorEl(null);

        const handleEditClick = () => {
            setIsEditing(true);
            handleMenuClose();
        };

        const handleDeleteClick = () => {
            onTaskDelete(task.id, project.id);
            handleMenuClose();
        };

        const handleAddSubtaskClick = () => {
            setReplyingTo(task.id);
            handleMenuClose();
        };

        const handleSaveEdit = () => {
            if (editText.trim()) {
                onTaskEdit(task.id, editText, project.id);
                setIsEditing(false);
            }
        };

        return (
            <React.Fragment key={task.id}>
                <ListItem
                    style={{ paddingLeft: `${level * 24 + 16}px` }}
                    secondaryAction={
                        isEditing ? (
                            <Box sx={{ display: 'flex' }}>
                                <IconButton edge="end" title="Salvar" onClick={handleSaveEdit}><SaveIcon /></IconButton>
                                <IconButton edge="end" title="Cancelar" onClick={() => setIsEditing(false)}><CancelIcon /></IconButton>
                            </Box>
                        ) : (
                            <IconButton edge="end" title="Opções" onClick={handleMenuClick}><MoreVertIcon /></IconButton>
                        )
                    }
                >
                    <ListItemIcon><Checkbox edge="start" checked={task.concluida} onChange={() => onTaskToggle(task)} /></ListItemIcon>
                    {isEditing ? (
                        <TextField value={editText} onChange={(e) => setEditText(e.target.value)} variant="standard" fullWidth autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}/>
                    ) : (
                        <ListItemText primary={task.descricao} style={{ textDecoration: task.concluida ? 'line-through' : 'none' }} />
                    )}
                    {taskPriorityInfo && !isEditing && <Chip label={taskPriorityInfo.label} color={taskPriorityInfo.color} size="small" sx={{ ml: 2 }}/>}
                </ListItem>
                <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
                    <MenuItem onClick={handleAddSubtaskClick}><ListItemIcon><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>Adicionar Subtarefa</MenuItem>
                    <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar</MenuItem>
                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar</MenuItem>
                </Menu>
                {replyingTo === task.id && (
                    <Box style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                        <NewTaskForm parentId={task.id} onTaskAdded={handleTaskAdded} onCancel={() => setReplyingTo(null)} />
                    </Box>
                )}
                {task.children?.length > 0 && (
                    <List component="div" disablePadding>
                        {task.children.map(child => <TaskItem key={child.id} task={child} level={level + 1} />)}
                    </List>
                )}
            </React.Fragment>
        );
    };
    
    // Função de renderização que passa as props para o primeiro nível de tarefas
    const renderTaskTree = (tasks) => {
        return tasks.map(task => (
            <TaskItem key={task.id} task={task} />
        ));
    };

    return (
        <>
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ position: 'relative' }}>
                    <IconButton
                        aria-label="opções"
                        onClick={handleMenuOpen}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Box onClick={() => setIsExpanded(!isExpanded)} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: '40px' }}>
                            <Typography variant="h5" component="div">{project.codigo_tag}</Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ mb: 1 }}>{project.nome_detalhado}</Typography>
                        {/* --- INÍCIO DOS NOVOS BALÕES (CHIPS) --- */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {project.tarefas && project.tarefas.length > 0 && (
                                <Tooltip title="Tarefas Concluídas">
                                    <Chip
                                        icon={<TaskAltIcon />}
                                        label={`${projectStats.completedTasks} / ${projectStats.totalTasks}`}
                                        size="small"
                                        color={projectStats.completedTasks === projectStats.totalTasks ? 'success' : 'default'}
                                    />
                                </Tooltip>
                            )}
                            {nearestDeadlineInfo && (
                                <Tooltip title="Prazo Mais Próximo">
                                    <Chip
                                        icon={<EventBusyIcon />}
                                        label={nearestDeadlineInfo.label}
                                        color={nearestDeadlineInfo.color}
                                        size="small"
                                    />
                                </Tooltip>
                            )}
                        </Box>
                        {/* --- FIM DOS NOVOS BALÕES (CHIPS) --- */}
                    </Box>
                </CardContent>
                {isExpanded && (
                    <CardContent sx={{ borderTop: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Tarefas</Typography>
                            <Box>
                                <Tooltip title="Adicionar Tarefa Principal">
                                    <IconButton onClick={() => setIsModalOpen(true)}><AddIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Abrir Página do Projeto">
                                    <IconButton component={Link} to={`/projetos/${project.id}`} size="small"><OpenInNewIcon fontSize="inherit" /></IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        {taskTree.length > 0 ? (
                            <List dense>{renderTaskTree(taskTree)}</List>
                        ) : (
                            !isModalOpen && <Typography variant="body2" sx={{ mt: 1 }}>Este projeto ainda não possui tarefas.</Typography>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* --- MENU E DIALOG PARA O PROJETO --- */}
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar Projeto</MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar Projeto</MenuItem>
            </Menu>

            <Dialog open={isEditing} onClose={() => setIsEditing(false)} fullWidth>
                <DialogTitle>Editar Projeto</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Código / Tag" type="text" fullWidth variant="outlined" value={editData.codigo_tag} onChange={(e) => setEditData({...editData, codigo_tag: e.target.value})} />
                    <TextField margin="dense" label="Nome Detalhado" type="text" fullWidth variant="outlined" value={editData.nome_detalhado} onChange={(e) => setEditData({...editData, nome_detalhado: e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateProject} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Nova Tarefa Principal para "{project.codigo_tag}"</DialogTitle>
                <DialogContent>
                    <NewTaskForm
                        projectId={project.id}
                        onTaskAdded={handleTaskAdded}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ProjectCard;