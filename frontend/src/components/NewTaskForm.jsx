// frontend/src/components/NewTaskForm.jsx

import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { TextField, Button, Box, Typography } from '@mui/material';

function NewTaskForm({ projectId, parentId, onTaskAdded, onCancel }) {
  const [descricao, setDescricao] = useState('');
  const [dataPrazo, setDataPrazo] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!descricao.trim()) {
      setError('A descrição da tarefa é obrigatória.');
      return;
    }

    const payload = {
      descricao: descricao,
      data_prazo: dataPrazo || null,
    };
    if (parentId) {
      payload.tarefa_pai = parentId;
    } else {
      payload.projeto = projectId;
    }

    try {
      const response = await apiClient.post('/tarefas/', payload);
      onTaskAdded(response.data);
      setDescricao('');
      setDataPrazo('');
    } catch (err) {
      setError('Ocorreu um erro ao criar a tarefa.');
      console.error(err);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {parentId ? 'Adicionar Subtarefa' : 'Nova Tarefa Principal'}
      </Typography>
      
      {/* AQUI ESTÁ O CAMPO QUE ESTAVA FALTANDO */}
      <TextField
        label="Descrição da Tarefa"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        fullWidth
        required
        autoFocus
        margin="normal"
        size="small"
      />

      <TextField
        label="Prazo (Opcional)"
        type="date"
        value={dataPrazo}
        onChange={(e) => setDataPrazo(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
        InputLabelProps={{
          shrink: true,
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button type="submit" variant="contained" size="small">
          Adicionar
        </Button>
        {onCancel && <Button variant="outlined" size="small" onClick={onCancel}>Cancelar</Button>}
      </Box>
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </Box>
  );
}

export default NewTaskForm;