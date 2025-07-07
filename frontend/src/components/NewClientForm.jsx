// frontend/src/components/NewClientForm.jsx

import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';

// Este componente recebe uma função 'onClientAdded' como propriedade (prop)
// para poder avisar o componente pai que um novo cliente foi criado.
function NewClientForm({ onClientAdded }) {
  const [name, setName] = useState(''); // Estado para guardar o valor do input
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Impede o recarregamento da página ao submeter o form
    setError(null); // Limpa erros anteriores

    if (!name.trim()) {
      setError('O nome do cliente não pode estar em branco.');
      return;
    }

    try {
      // Fazemos a requisição POST para a nossa API
      const response = await apiClient.post('/clientes/', {
        nome: name,
      });

      // Se a requisição for bem-sucedida, chamamos a função passada pelo pai
      // e passamos o novo cliente que a API retornou.
      onClientAdded(response.data);
      setName(''); // Limpa o campo do formulário
    } catch (err) {
      setError('Ocorreu um erro ao criar o cliente.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h4>Adicionar Novo Cliente</h4>
      <div>
        <label htmlFor="clientName">Nome: </label>
        <input
          id="clientName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Cliente"
          required
        />
      </div>
      <button type="submit" style={{ marginTop: '10px' }}>Salvar Cliente</button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </form>
  );
}

export default NewClientForm;