import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Entregadores from './Entregadores';
import { foodAPI } from '../services/api';
import { Provider } from '../components/ui/provider';
import { AppProvider } from '../context/AppContext';

// Mock matchMedia required by Chakra UI in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do foodAPI
vi.mock('../services/api', () => ({
  foodAPI: {
    getDrivers: vi.fn(),
  }
}));

const mockDrivers = [
  { _id: '1', name: 'João Entregador', whatsapp: '11999999999', status: 'disponivel', isActive: true, priority: 10, deliveriesToday: 2 },
  { _id: '2', name: 'Maria Moto', whatsapp: '11888888888', status: 'ocupado', isActive: true, priority: 5, deliveriesToday: 5 }
];

describe('Entregadores Component', () => {
  it('renders correctly and fetches motoboys/entregadores', async () => {
    // Resolver a Promessa com os mocks
    foodAPI.getDrivers.mockResolvedValue({ data: mockDrivers });

    render(
      <Provider>
        <AppProvider>
          <BrowserRouter>
            <Entregadores />
          </BrowserRouter>
        </AppProvider>
      </Provider>
    );

    // Verifica Título (usa a string exata, pode ter Case diferente)
    expect(screen.getByText('Frota de Entregadores')).toBeDefined();

    // Aguarda o Mock resolver e renderizar a tabela
    await waitFor(() => {
      expect(screen.getByText('João Entregador')).toBeDefined();
    });

    expect(screen.getByText('Maria Moto')).toBeDefined();

    // Verifica que badges renderizam corretamente
    expect(screen.getByText('Disponível')).toBeDefined();
    expect(screen.getByText('Em Entrega')).toBeDefined();
  });
});
