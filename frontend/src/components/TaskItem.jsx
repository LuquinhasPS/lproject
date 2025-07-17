// frontend/src/components/TaskItem.jsx

import React, { useState } from 'react';
import {
    ListItem, ListItemIcon, ListItemText, Checkbox, IconButton,
    Box, TextField, Menu, MenuItem, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getPriorityInfo } from '../utils/priority';

function TaskItem({ task, level = 0, onToggle, onEdit, onDelete, onAddSubtaskClick }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.descricao);
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);
    const taskPriorityInfo = getPriorityInfo(task.data_prazo);

    const handleMenuClick = (event) => { event.stopPropagation(); setAnchorEl(event.currentTarget); };
    const handleMenuClose = () => setAnchorEl(null);
    const handleEditClick = () => { setIsEditing(true); handleMenuClose(); };
    const handleDeleteClick = () => { onDelete(task.id); handleMenuClose(); };
    const handleAddSubtaskClick = () => { onAddSubtaskClick(task.id); handleMenuClose(); };

    const handleSaveEdit = () => {
        if (editText.trim()) {
            onEdit(task.id, editText);
            setIsEditing(false);
        }
    };

    return (
        <>
            <ListItem
                style={{ paddingLeft: `${level * 24 + 16}px` }}
                secondaryAction={
                    isEditing ? (
                        <Box sx={{ display: 'flex' }}>
                            <IconButton title="Salvar" onClick={handleSaveEdit}><SaveIcon /></IconButton>
                            <IconButton title="Cancelar" onClick={() => setIsEditing(false)}><CancelIcon /></IconButton>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {taskPriorityInfo && <Chip label={taskPriorityInfo.label} color={taskPriorityInfo.color} size="small" />}
                            <IconButton title="Opções" onClick={handleMenuClick}><MoreVertIcon /></IconButton>
                        </Box>
                    )
                }
            >
                <ListItemIcon>
                    <Checkbox edge="start" checked={task.concluida} onChange={() => onToggle(task)} />
                </ListItemIcon>
                {isEditing ? (
                    <TextField value={editText} onChange={(e) => setEditText(e.target.value)} variant="standard" fullWidth autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} />
                ) : (
                    <ListItemText primary={task.descricao} style={{ textDecoration: task.concluida ? 'line-through' : 'none' }} />
                )}
            </ListItem>
            <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
                <MenuItem onClick={handleAddSubtaskClick}><ListItemIcon><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>Adicionar Subtarefa</MenuItem>
                <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar</MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Deletar</MenuItem>
            </Menu>
        </>
    );
}

export default TaskItem;