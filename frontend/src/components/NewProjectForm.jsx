// frontend/src/components/NewProjectForm.jsx

import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import {
    TextField,
    Button,
    Box,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from '@mui/material';

// O formulário agora pode receber um ID de cliente fixo OU uma lista de clientes
function NewProjectForm({ clienteId, clients = [], onProjectAdded, onCancel }) {
    const [codigoTag, setCodigoTag] = useState('');
    const [nomeDetalhado, setNomeDetalhado] = useState('');
    // Se não recebermos um clienteId, o estado do cliente selecionado começa vazio
    const [selectedClient, setSelectedClient] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // Determina qual ID de cliente usar: o fixo ou o do seletor
        const finalClientId = clienteId || selectedClient;

        if (!finalClientId) {
            setError('Você precisa selecionar um cliente.');
            return;
        }
        if (!codigoTag.trim()) {
            setError('O código/tag do projeto é obrigatório.');
            return;
        }

        try {
            const response = await apiClient.post('/projetos/', {
                cliente: finalClientId,
                codigo_tag: codigoTag,
                nome_detalhado: nomeDetalhado,
            });

            onProjectAdded(response.data);
            setCodigoTag('');
            setNomeDetalhado('');
            setSelectedClient('');

        } catch (err) {
            setError('Ocorreu um erro ao criar o projeto.');
            console.error(err);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}
        >
            <Typography variant="h6" gutterBottom>Adicionar Novo Projeto</Typography>

            {/* --- RENDERIZAÇÃO CONDICIONAL --- */}
            {/* O seletor de cliente só aparece se não tivermos um ID de cliente fixo */}
            {!clienteId && (
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
            )}

            <TextField
                label="Código / Tag do Projeto"
                value={codigoTag}
                onChange={(e) => setCodigoTag(e.target.value)}
                fullWidth
                required
                margin="normal"
            />
            <TextField
                label="Nome Detalhado (Opcional)"
                value={nomeDetalhado}
                onChange={(e) => setNomeDetalhado(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button type="submit" variant="contained">
                    Salvar Projeto
                </Button>
                {onCancel && (
                    <Button variant="outlined" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
            </Box>
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Box>
    );
}

export default NewProjectForm;