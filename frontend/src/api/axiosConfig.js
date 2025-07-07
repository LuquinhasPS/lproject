// frontend/src/api/axiosConfig.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Interceptor de Requisição: Anexa o token em cada chamada
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INÍCIO DA NOVA LÓGICA DE REFRESH ---

// Interceptor de Resposta: Lida com erros de token expirado
apiClient.interceptors.response.use(
  // Se a resposta for bem-sucedida, apenas a retorna
  (response) => response,

  // Se a resposta der erro, executa esta função
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 (Não autorizado) e ainda não tentamos renovar o token para esta requisição
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca que já tentamos uma vez

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Pede um novo access token usando o refresh token
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken,
        });
        const newAccessToken = response.data.access;

        // Salva o novo token e atualiza o cabeçalho do apiClient
        localStorage.setItem('accessToken', newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Tenta novamente a requisição original que falhou
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Se o refresh token também falhar, desloga o usuário (opcional)
        console.error("Refresh token inválido. Deslogando...");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Redireciona para a página de login
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }

    // Para qualquer outro erro, apenas o rejeita
    return Promise.reject(error);
  }
);

export default apiClient;