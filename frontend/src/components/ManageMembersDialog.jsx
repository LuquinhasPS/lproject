// frontend/src/components/ManageMembersDialog.jsx
import { useAuth } from '../context/useAuth.js';
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem,
    ListItemText, IconButton, Select, MenuItem, FormControl, Box,
    Typography, Autocomplete, TextField, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';


function ManageMembersDialog({ project, open, onClose }) {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { authToken } = useAuth(); // Pega o token para decodificar o user ID

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('EDITOR');

    const getUserIdFromToken = () => {
        if (!authToken) return null;
        try {
            return JSON.parse(atob(authToken.split('.')[1])).user_id;
        } catch (e) {
            return null;
        }
    };
    const currentUserId = getUserIdFromToken();

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setLoading(true);
                setError('');
                try {
                    const [membersResponse, usersResponse] = await Promise.all([
                        apiClient.get(`/projetos/${project.id}/membros/`),
                        apiClient.get('/users/')
                    ]);
                    
                    const memberDetails = membersResponse.data.map(member => {
                        const userDetail = usersResponse.data.find(u => u.id === member.usuario);
                        return { ...member, username: userDetail?.username || 'Usuário desconhecido' };
                    });
                    setMembers(memberDetails);

                    const memberIds = membersResponse.data.map(m => m.usuario);
                    setAllUsers(usersResponse.data.filter(u => !memberIds.includes(u.id)));
                } catch (err) {
                    setError('Não foi possível carregar os dados. Você precisa ser admin do projeto.');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [open, project.id]);

    const handleAddMember = async () => {
        if (!selectedUser) return;
        try {
            const response = await apiClient.post(`/projetos/${project.id}/membros/`, {
                usuario: selectedUser.id,
                papel: selectedRole
            });
            const newUserDetail = allUsers.find(u => u.id === response.data.usuario);
            setMembers(current => [...current, { ...response.data, username: newUserDetail.username }]);
            setAllUsers(current => current.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
        } catch (err) { alert("Não foi possível adicionar o membro."); }
    };

    const handleRemoveMember = async (member) => {
        if (!window.confirm(`Remover "${member.username}" do projeto?`)) return;
        try {
            await apiClient.delete(`/projetos/${project.id}/membros/${member.id}/`);
            setMembers(current => current.filter(m => m.id !== member.id));
            const userToAddBack = allUsers.find(u => u.id === member.usuario) || {id: member.usuario, username: member.username};
            if(userToAddBack) setAllUsers(current => [...current, userToAddBack]);
        } catch (err) { alert("Não foi possível remover o membro."); }
    };
    
    const handleRoleChange = async (memberId, newRole) => {
        try {
            await apiClient.patch(`/projetos/${project.id}/membros/${memberId}/`, { papel: newRole });
            setMembers(current => current.map(m => m.id === memberId ? { ...m, papel: newRole } : m));
        } catch (err) { alert("Não foi possível alterar o papel."); }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Gerenciar Colaboradores de "{project.codigo_tag}"</DialogTitle>
            <DialogContent>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        <Typography variant="h6" sx={{mt: 2}}>Membros Atuais</Typography>
                        <List>
                            {members.map(member => (
                                <ListItem key={member.id} secondaryAction={
                                    member.usuario !== currentUserId && (
                                    <IconButton edge="end" onClick={() => handleRemoveMember(member)}>
                                        <DeleteIcon />
                                    </IconButton>
                                    )
                                }>
                                    <ListItemText primary={member.username} />
                                    <FormControl size="small">
                                        <Select value={member.papel} onChange={(e) => handleRoleChange(member.id, e.target.value)} disabled={member.usuario === currentUserId}>
                                            <MenuItem value="ADMIN">Admin</MenuItem>
                                            <MenuItem value="EDITOR">Editor</MenuItem>
                                            <MenuItem value="VIEWER">Visualizador</MenuItem>
                                        </Select>
                                    </FormControl>
                                </ListItem>
                            ))}
                        </List>
                        <Typography variant="h6" sx={{mt: 4}}>Adicionar Novo Membro</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                            <Autocomplete
                                options={allUsers}
                                getOptionLabel={(option) => option.username}
                                value={selectedUser}
                                onChange={(event, newValue) => setSelectedUser(newValue)}
                                sx={{ flexGrow: 1 }}
                                renderInput={(params) => <TextField {...params} label="Buscar Usuário" />}
                            />
                            <FormControl size="small" sx={{minWidth: 120}}>
                                <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                    <MenuItem value="ADMIN">Admin</MenuItem>
                                    <MenuItem value="EDITOR">Editor</MenuItem>
                                </Select>
                            </FormControl>
                            <Button onClick={handleAddMember} variant="contained">Adicionar</Button>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ManageMembersDialog;