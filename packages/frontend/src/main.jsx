import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from "./components/ui/provider";
import { AppProvider, useApp } from './context/AppContext';

import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Kitchen from './pages/Kitchen';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Entregadores from './pages/Entregadores';
import MenuPages from './pages/MenuPages';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';

// Lógica de Proteção
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  React.useEffect(() => {
    if (!token) {
      window.location.href = (import.meta.env.VITE_LOGIN_URL || 'http://localhost:5174') + '/login?appSlug=calango-food';
    }
  }, [token]);
  return token ? children : null;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page é a porta de entrada */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Callback */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route path="/cardapio/:slug" element={<MenuPages />} />
            <Route path="/checkout/:slug" element={<CheckoutPage />} />
            <Route path="/pedido/:orderId" element={<OrderStatusPage />} />

            {/* Painel Administrativo Protegido */}
            <Route path="/kitchen" element={
              <ProtectedRoute>
                <Kitchen />
              </ProtectedRoute>
            } />

            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />

            <Route path="/categories" element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            } />

            <Route path="/entregadores" element={
              <ProtectedRoute>
                <Entregadores />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </Provider>
  </React.StrictMode>
);