import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from "./components/ui/provider";
import { AppProvider, useApp } from './context/AppContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Kitchen from './pages/Kitchen';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Menu from './pages/Menu';
import Entregadores from './pages/Entregadores';

// Lógica de Proteção
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Redireciona para a Landing Page se não tiver token
  return token ? children : <Navigate to="/" replace />;
};

// Componente para rotas que logados NÃO devem ver (como Login)
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Se já está logado, manda direto para o painel (Kitchen no seu caso)
  return token ? <Navigate to="/kitchen" replace /> : children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page é a porta de entrada */}
            <Route path="/" element={<LandingPage />} />

            {/* Login e Cadastro */}
            <Route path="/login" element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } />

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

            {/* Rota Pública do Cardápio Digital */}
            <Route path="/menu/:tenantId" element={<Menu />} />

            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </Provider>
  </React.StrictMode>
);