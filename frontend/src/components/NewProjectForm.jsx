// frontend/src/components/NewProjectForm.jsx

import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import {
    TextField, Button, Box, Typography,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';

// O formulário agora sempre espera a lista de clientes
function NewProjectForm({ clients = [], onProjectAdded, onCancel }) {
    const [codigoTag, setCodigoTag] = useState('');
    const [nomeDetalhado, setNomeDetalhado] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [dataPrazo, setDataPrazo] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        if (!selectedClient) {
            setError('Você precisa selecionar um cliente.');
            return;
        }
        try {
            const response = await apiClient.post('/projetos/', {
                cliente: selectedClient,
                codigo_tag: codigoTag,
                nome_detalhado: nomeDetalhado,
                data_prazo: dataPrazo || null,
            });
            onProjectAdded(response.data);
        } catch (err) {
            setError('Ocorreu um erro ao criar o projeto.');
            console.error(err);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth required margin="normal">
                <InputLabel id="select-client-label">Cliente</InputLabel>
                <Select
                    labelId="select-client-label"
                    value={selectedClient}
                    label="Cliente"
                    onChange={(e) => setSelectedClient(e.target.value)}
                >
                    {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                            {client.nome}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField fullWidth required margin="normal" label="Código / Tag do Projeto" value={codigoTag} onChange={(e) => setCodigoTag(e.target.value)} />
            <TextField fullWidth margin="normal" label="Nome Detalhado (Opcional)" value={nomeDetalhado} onChange={(e) => setNomeDetalhado(e.target.value)} />
            <TextField fullWidth margin="normal" label="Prazo (Opcional)" type="date" value={dataPrazo} onChange={(e) => setDataPrazo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button type="submit" variant="contained">Salvar Projeto</Button>
                {onCancel && <Button variant="outlined" onClick={onCancel}>Cancelar</Button>}
            </Box>
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Box>
    );
}

export default NewProjectForm;