// frontend/src/components/ProjectCard.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Card, CardContent, Box, Typography, List, ListItem,
    ListItemIcon, ListItemText, Checkbox, IconButton, Button, TextField, Chip,
    Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NewTaskForm from './NewTaskForm';
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

    const projectPriorityInfo = getPriorityInfo(project.data_prazo);

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
        setIsTaskModalOpen(false);
    };

    const handleMenuOpen = (event) => { event.stopPropagation(); setMenuAnchorEl(event.currentTarget); };
    const handleMenuClose = () => setMenuAnchorEl(null);
    const handleEditClick = () => { setIsEditingProject(true); handleMenuClose(); };
    const handleDeleteClick = () => { onProjectDelete(); handleMenuClose(); };
    const handleUpdateProject = () => { onProjectUpdate(editProjectData); setIsEditingProject(false); };

    const TaskItem = ({ task, level = 0 }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editText, setEditText] = useState(task.descricao);
        const taskPriorityInfo = getPriorityInfo(task.data_prazo);
        const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
        const isTaskMenuOpen = Boolean(taskMenuAnchor);

        const handleTaskMenuClick = (event) => { event.stopPropagation(); setTaskMenuAnchor(event.currentTarget); };
        const handleTaskMenuClose = () => setTaskMenuAnchor(null);

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
                            <IconButton edge="end" title="Opções da Tarefa" onClick={handleTaskMenuClick}><MoreVertIcon /></IconButton>
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
                <Menu anchorEl={taskMenuAnchor} open={isTaskMenuOpen} onClose={handleTaskMenuClose}>
                    <MenuItem onClick={() => { setReplyingTo(task.id); handleTaskMenuClose(); }}><ListItemIcon><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>Adicionar Subtarefa</MenuItem>
                    <MenuItem onClick={() => { setIsEditing(true); handleTaskMenuClose(); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar</MenuItem>
                    <MenuItem onClick={() => { onTaskDelete(task.id, project.id); handleTaskMenuClose(); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar</MenuItem>
                </Menu>
                {replyingTo === task.id && (
                    <Box style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                        <NewTaskForm parentId={task.id} onTaskAdded={handleTaskAdded} onCancel={() => setReplyingTo(null)} />
                    </Box>
                )}
                {task.children?.length > 0 && (
                    <List component="div" disablePadding>
                        {renderTaskTree(task.children, level + 1)}
                    </List>
                )}
            </React.Fragment>
        );
    };
    
    const renderTaskTree = (tasks, level = 0) => tasks.map(task => <TaskItem key={task.id} task={task} level={level} />);

    return (
        <>
            <Card sx={{ mb: 2 }}>
                <Box sx={{ p: 2, position: 'relative' }}>
                    <IconButton aria-label="opções do projeto" onClick={handleMenuOpen} sx={{ position: 'absolute', top: 4, right: 4 }}><MoreVertIcon /></IconButton>
                    <Box onClick={() => setIsExpanded(!isExpanded)} sx={{ cursor: 'pointer', pr: '40px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{project.codigo_tag}</Typography>
                            {projectPriorityInfo && (<Chip label={projectPriorityInfo.label} color={projectPriorityInfo.color} size="small" />)}
                        </Box>
                        <Typography color="text.secondary" variant="body2">{project.nome_detalhado}</Typography>
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
                        {taskTree.length > 0 ? <List dense>{renderTaskTree(taskTree)}</List> : <Typography variant="body2" sx={{ mt: 1 }}>Sem tarefas.</Typography>}
                    </CardContent>
                </Collapse>
            </Card>

            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar Projeto</MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar Projeto</MenuItem>
            </Menu>

            <Dialog open={isEditingProject} onClose={() => setIsEditingProject(false)} fullWidth>
                <DialogTitle>Editar Projeto "{project.codigo_tag}"</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Código / Tag" type="text" fullWidth variant="outlined" value={editProjectData.codigo_tag} onChange={(e) => setEditProjectData({...editProjectData, codigo_tag: e.target.value})} sx={{mt:2}}/>
                    <TextField margin="dense" label="Nome Detalhado" type="text" fullWidth variant="outlined" value={editProjectData.nome_detalhado} onChange={(e) => setEditProjectData({...editProjectData, nome_detalhado: e.target.value})} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditingProject(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateProject} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
                <DialogTitle>Nova Tarefa em "{project.codigo_tag}"</DialogTitle>
                <DialogContent><NewTaskForm projectId={project.id} onTaskAdded={handleTaskAdded} onCancel={() => setIsTaskModalOpen(false)} /></DialogContent>
            </Dialog>
        </>
    );
}

export default ProjectCard;