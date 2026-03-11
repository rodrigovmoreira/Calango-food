import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from "socket.io-client";

const AppContext = createContext();

const initialState = {
  user: null,
  whatsappStatus: {
    isConnected: false,
    mode: 'Desconectado',
    qrCode: null,
  },
  loading: false
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_QR_CODE':
      return {
        ...state,
        whatsappStatus: { 
          ...state.whatsappStatus, 
          qrCode: action.payload,
          isConnected: false,
          mode: 'Aguardando Leitura'
        }
      };
    case 'SET_WHATSAPP_STATUS':
      return {
        ...state,
        whatsappStatus: {
          ...state.whatsappStatus,
          isConnected: action.payload.isConnected,
          mode: action.payload.mode,
          // Se conectou, limpamos o QR Code da tela
          qrCode: action.payload.isConnected ? null : state.whatsappStatus.qrCode
        }
      };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 1. Restaurar Sessão ao Carregar a Página
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        dispatch({ type: 'SET_USER', payload: JSON.parse(userStr) });
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // 2. Conexão Socket.io com Isolamento por Tenant
  useEffect(() => {
    // Só tentamos conectar o socket se o usuário estiver logado e tiver um ID
    if (!state.user?.id) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    
    // A MÁGICA: Passamos o tenantId na query para o backend isolar a conexão
    const socket = io(API_URL, {
      query: { tenantId: state.user.id },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log(`📡 Conectado ao servidor. Sala: ${state.user.id}`);
    });

    // Ouve o QR Code (Direcionado apenas para este tenantId no backend)
    socket.on('whatsapp_qr', (data) => {
      dispatch({ type: 'SET_QR_CODE', payload: data.image });
    });

    // Ouve o Status do WhatsApp (ready, connected, etc)
    socket.on('whatsapp_status', (data) => {
      const isConnected = data.status === 'connected' || data.status === 'ready';
      dispatch({ 
        type: 'SET_WHATSAPP_STATUS', 
        payload: { 
          isConnected, 
          mode: isConnected ? 'Conectado' : data.status 
        } 
      });
    });

    // Cleanup: Desconecta o socket ao fazer logout ou fechar a aba
    return () => socket.disconnect();
  }, [state.user?.id]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de um AppProvider');
  return context;
};