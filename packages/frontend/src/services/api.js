import axios from 'axios';

// No Vite 7, usamos import.meta.env em vez de process.env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
});

// Interceptor: Adiciona Token JWT se existir no localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Gerencia expiração de sessão (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Rotas de Autenticação (Baseado no SystemUser) ---
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

// --- Rotas de Negócio (Calango-food) ---
export const foodAPI = {
  // 0. Estabelecimento (Público)
  getPublicProfile: (tenantId) => api.get(`/api/store/public/${tenantId}`),
  getPublicMenu: (slug) => api.get(`/api/store/menu/${slug}`),

  // 1. Cozinha e Pedidos
  getOrders: (status) => api.get('/api/orders', { params: { status } }),
  updateOrderStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }),
  dispatchOrder: (data) => api.post('/api/dispatch', data), // Integração com Logística

  // 1.5. Entregadores (Logística)
  getDrivers: () => api.get('/api/drivers'),
  createDriver: (data) => api.post('/api/drivers', data),
  updateDriver: (id, data) => api.put(`/api/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/api/drivers/${id}`),

  // 2. Cardápio Digital (Produtos)
  getPublicProducts: (tenantId) => api.get(`/api/products/public/${tenantId}`),
  getProducts: () => api.get('/api/products'),
  createProduct: (data) => api.post('/api/products', data),

  createOrder: (data) => api.post('/api/orders', data),
  updateProduct: (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),

  // 2.5. Categorias
  getCategories: () => api.get('/api/categories'),
  createCategory: (data) => api.post('/api/categories', data),
  updateCategory: (id, data) => api.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/categories/${id}`),

  // 3. Configurações do Restaurante (WhatsApp & Tenant)
  getWhatsAppStatus: () => api.get('/api/whatsapp/status'),
  connectWhatsApp: () => api.post('/api/whatsapp/connect'),
  disconnectWhatsApp: () => api.post('/api/whatsapp/disconnect'),
};

export default api;