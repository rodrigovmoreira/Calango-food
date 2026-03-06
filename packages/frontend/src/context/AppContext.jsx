import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from "socket.io-client";

const AppContext = createContext();

const initialState = {
  user: null,
  whatsappStatus: {
    isConnected: false,
    mode: 'Iniciando...',
    qrCode: null,
  },
  loading: false
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, whatsappStatus: initialState.whatsappStatus };
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
          // Limpa o QR Code se já estiver conectado
          qrCode: action.payload.isConnected ? null : state.whatsappStatus.qrCode
        }
      };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 1. Persistência de Sessão (User + Token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        dispatch({ type: 'SET_USER', payload: JSON.parse(userStr) });
      } catch (e) {
        console.error("Erro ao restaurar sessão:", e);
      }
    }
  }, []);

  // 2. Conexão Socket.io (Monitoramento do WhatsApp)
  useEffect(() => {
    // Só conecta o socket se houver um usuário (tenant) logado
    if (!state.user?.id) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    const socket = io(API_URL, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      // Join na sala do tenant para receber apenas os seus eventos
      socket.emit('join_session', state.user.id);
    });

    // Ouve o QR Code gerado pelo backend
    socket.on('whatsapp_qr', (data) => {
      dispatch({ type: 'SET_QR_CODE', payload: data.image });
    });

    // Ouve mudanças de status (ready, authenticated, etc)
    socket.on('whatsapp_status', (data) => {
      const isConnected = data.status === 'connected' || data.status === 'ready';
      dispatch({ 
        type: 'SET_WHATSAPP_STATUS', 
        payload: { isConnected, mode: data.status } 
      });
    });

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