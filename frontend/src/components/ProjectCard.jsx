// frontend/src/components/ProjectCard.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import {
    Card, CardContent, CardActionArea, Box, Typography, List, ListItem,
    ListItemIcon, ListItemText, Checkbox, IconButton, Button, TextField, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import NewTaskForm from './NewTaskForm';
import { getPriorityInfo } from '../utils/priority';

function ProjectCard({ project, onTaskToggle, onTaskEdit, onTaskDelete, onTaskAdd }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

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

    const handleAddSubtask = (newTask) => {
        onTaskAdd(newTask, project.id);
        setReplyingTo(null);
    };

// Dentro do seu componente ProjectCard.jsx

// Este é o componente TaskItem completo e corrigido
const TaskItem = ({ task, level = 0, onToggle, onDelete, onEdit, onAddSubtaskClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.descricao);
    const taskPriorityInfo = getPriorityInfo(task.data_prazo);

    const handleSaveEdit = () => {
        if (editText.trim()) {
            // Chama a função onEdit que veio como prop do componente pai
            onEdit(task.id, editText, project.id);
            setIsEditing(false);
        }
    };

    return (
        <>
            <ListItem
                style={{ paddingLeft: `${level * 24 + 16}px` }}
                secondaryAction={
                    // Usamos um Box para alinhar os ícones e o chip com espaçamento
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {taskPriorityInfo && !isEditing && (
                            <Chip label={taskPriorityInfo.label} color={taskPriorityInfo.color} size="small" />
                        )}

                        {isEditing ? (
                            <>
                                <IconButton edge="end" title="Salvar" onClick={handleSaveEdit}><SaveIcon /></IconButton>
                                <IconButton edge="end" title="Cancelar" onClick={() => setIsEditing(false)}><CancelIcon /></IconButton>
                            </>
                        ) : (
                            <>
                                <IconButton edge="end" title="Adicionar Subtarefa" onClick={() => onAddSubtaskClick(task.id)}><AddCircleOutlineIcon fontSize="small" /></IconButton>
                                <IconButton edge="end" title="Editar Tarefa" onClick={() => setIsEditing(true)}><EditIcon fontSize="small" /></IconButton>
                                <IconButton edge="end" title="Deletar Tarefa" onClick={() => onDelete(task.id, project.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </>
                        )}
                    </Box>
                }
            >
                <ListItemIcon>
                    {/* O Checkbox agora chama a função onToggle que veio do pai */}
                    <Checkbox edge="start" checked={task.concluida} onChange={() => onToggle(task)} />
                </ListItemIcon>
                {isEditing ? (
                    <TextField 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)} 
                        variant="standard" 
                        fullWidth 
                        autoFocus 
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                ) : (
                    <ListItemText
                        primary={task.descricao}
                        style={{ textDecoration: task.concluida ? 'line-through' : 'none', color: task.concluida ? 'grey' : 'inherit' }}
                    />
                )}
            </ListItem>
            
            {/* O formulário de subtarefa será renderizado pelo ProjectCard */}

            {/* --- AQUI ESTÁ A CORREÇÃO CRUCIAL DA RECURSÃO --- */}
            {task.children?.length > 0 && (
                <List component="div" disablePadding>
                    {task.children.sort((a,b) => a.concluida - b.concluida).map(child => (
                        <TaskItem 
                            key={child.id} 
                            task={child} 
                            level={level + 1}
                            // Repassando todas as funções para o próximo nível
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onAddSubtaskClick={onAddSubtaskClick}
                        />
                    ))}
                </List>
            )}
        </>
    );
};

    // Função de renderização principal que passa as props para o primeiro nível
    const renderTaskTree = (tasks, level = 0) => {
        return tasks.map(task => (
            <TaskItem
                key={task.id}
                task={task}
                level={level}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit}
                onAddSubtaskClick={setReplyingTo}
            />
        ));
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardActionArea onClick={() => setIsExpanded(!isExpanded)}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5">{project.codigo_tag}</Typography>
                        {projectPriorityInfo && (
                            <Chip label={projectPriorityInfo.label} color={projectPriorityInfo.color} size="small" />
                        )}
                    </Box>
                    <Typography color="text.secondary">{project.nome_detalhado}</Typography>
                </CardContent>
            </CardActionArea>
            {isExpanded && (
                <CardContent sx={{ borderTop: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Tarefas</Typography>
                        <Button component={Link} to={`/projetos/${project.id}`} size="small">Página Dedicada</Button>
                    </Box>
                    {taskTree.length > 0 ? (
                        <List dense>
                            {renderTaskTree(taskTree)}
                        </List>
                    ) : (
                        <Typography variant="body2" sx={{ mt: 1 }}>Este projeto ainda não possui tarefas.</Typography>
                    )}
                    <Box sx={{ mt: 2, pl: 2 }}>
                        <NewTaskForm projectId={project.id} onTaskAdded={(newTask) => onTaskAdd(newTask, project.id)} />
                    </Box>
                </CardContent>
            )}
        </Card>
    );
}

export default ProjectCard;