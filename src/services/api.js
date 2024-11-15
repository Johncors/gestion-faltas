import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const pedidosService = {
  getPedidos: () => api.get('/pedidos'),
  crearPedido: (pedido) => api.post('/pedidos', pedido),
  actualizarEstado: (id, estado) => api.put(`/pedidos/${id}/estado`, { estado })
};