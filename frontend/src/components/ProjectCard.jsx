// frontend/src/components/ProjectCard.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Card, CardContent, Box, Typography, List, IconButton, Button,
    Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Tooltip, Collapse, Chip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon from '@mui/icons-material/People';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import NewTaskForm from './NewTaskForm';
import TaskItem from './TaskItem';
import ManageMembersDialog from './ManageMembersDialog';
import { getPriorityInfo } from '../utils/priority';


function ProjectCard({ project, onProjectUpdate, onProjectDelete, onTaskToggle, onTaskEdit, onTaskDelete, onTaskAdd }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editProjectData, setEditProjectData] = useState({
        codigo_tag: project.codigo_tag,
        nome_detalhado: project.nome_detalhado
    });
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

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

    const projectPriorityInfo = getPriorityInfo(project.data_prazo);
    const nearestTaskDeadlineInfo = getPriorityInfo(projectStats.nearestDeadline);

    const taskTree = useMemo(() => {
        if (!project?.tarefas) return [];
        const taskMap = new Map(project.tarefas.map(task => [task.id, { ...task, children: [] }]));
        const tree = [];
        project.tarefas.forEach(task => {
            if (task.tarefa_pai) {
                const parent = taskMap.get(task.tarefa_pai);
                if (parent) parent.children.push(taskMap.get(task.id));
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
        setIsTaskModalOpen(false);
    };

    const handleMenuOpen = (e) => { e.stopPropagation(); setMenuAnchorEl(e.currentTarget); };
    const handleMenuClose = () => setMenuAnchorEl(null);
    const handleEditClick = () => { setIsEditingProject(true); handleMenuClose(); };
    const handleDeleteClick = () => { onProjectDelete(); handleMenuClose(); };
    const handleUpdateProject = () => { onProjectUpdate(editProjectData); setIsEditingProject(false); };
    const handleManageMembersClick = () => { setIsMembersModalOpen(true); handleMenuClose(); };

    const renderTaskTree = (tasks, level = 0) => tasks.map(task => (
        <React.Fragment key={task.id}>
            <TaskItem
                task={task}
                level={level}
                onToggle={onTaskToggle}
                onDelete={(taskId) => onTaskDelete(taskId, project.id)}
                onEdit={(taskId, newDesc) => onTaskEdit(taskId, newDesc, project.id)}
                onAddSubtaskClick={setReplyingTo}
            />
            {replyingTo === task.id && (
                <Box style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                    <NewTaskForm parentId={task.id} onTaskAdded={handleTaskAdded} onCancel={() => setReplyingTo(null)} />
                </Box>
            )}
            {task.children?.length > 0 && <List component="div" disablePadding>{renderTaskTree(task.children, level + 1)}</List>}
        </React.Fragment>
    ));

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <Box sx={{ p: 2, position: 'relative', '&:hover .options-button': { opacity: 1 } }} onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
                    <IconButton className="options-button" aria-label="opções do projeto" onClick={handleMenuOpen} sx={{ position: 'absolute', top: 4, right: 4, opacity: 0, transition: 'opacity 0.2s' }}><MoreVertIcon /></IconButton>
                    <Box sx={{ pr: '40px' }}>
                        <Typography variant="h6">{project.codigo_tag}</Typography>
                        <Typography color="text.secondary" variant="body2">{project.nome_detalhado}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {project.tarefas?.length > 0 && (
                                <Tooltip title="Tarefas Concluídas"><Chip icon={<TaskAltIcon />} label={`${projectStats.completedTasks} / ${projectStats.totalTasks}`} size="small" color={projectStats.completedTasks === projectStats.totalTasks ? 'success' : 'default'} variant="outlined" /></Tooltip>
                            )}
                            {nearestTaskDeadlineInfo && (
                                <Tooltip title="Prazo de Tarefa Mais Próximo"><Chip icon={<EventBusyIcon />} label={nearestTaskDeadlineInfo.label} color={nearestTaskDeadlineInfo.color} size="small" /></Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <CardContent sx={{ borderTop: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontSize: '1rem' }}>Tarefas</Typography>
                            <Box>
                                <Tooltip title="Adicionar Tarefa Principal"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsTaskModalOpen(true); }}><AddIcon /></IconButton></Tooltip>
                                <Tooltip title="Abrir Página Dedicada"><IconButton component={Link} to={`/projetos/${project.id}`} size="small"><OpenInNewIcon fontSize="inherit" /></IconButton></Tooltip>
                            </Box>
                        </Box>
                        {taskTree.length > 0 ? <List dense>{renderTaskTree(taskTree)}</List> : <Typography variant="body2" sx={{ mt: 1, pl: 1 }}>Sem tarefas.</Typography>}
                    </CardContent>
                </Collapse>
            </Card>

            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleManageMembersClick}><ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>Colaboradores</MenuItem>
                <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar Projeto</MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar Projeto</MenuItem>
            </Menu>

            <Dialog open={isEditingProject} onClose={() => setIsEditingProject(false)} fullWidth><DialogTitle>Editar Projeto</DialogTitle><DialogContent><TextField autoFocus margin="dense" label="Tag" type="text" fullWidth value={editProjectData.codigo_tag} onChange={(e) => setEditProjectData({ ...editProjectData, codigo_tag: e.target.value })} sx={{mt: 2}} /><TextField margin="dense" label="Nome" type="text" fullWidth value={editProjectData.nome_detalhado} onChange={(e) => setEditProjectData({ ...editProjectData, nome_detalhado: e.target.value })} /></DialogContent><DialogActions><Button onClick={() => setIsEditingProject(false)}>Cancelar</Button><Button onClick={handleUpdateProject}>Salvar</Button></DialogActions></Dialog>
            <Dialog open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}><DialogTitle>Nova Tarefa em "{project.codigo_tag}"</DialogTitle><DialogContent><NewTaskForm projectId={project.id} onTaskAdded={handleTaskAdded} onCancel={() => setIsTaskModalOpen(false)} /></DialogContent></Dialog>
            {isMembersModalOpen && <ManageMembersDialog project={project} open={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} />}
        </>
    );
}

export default ProjectCard;