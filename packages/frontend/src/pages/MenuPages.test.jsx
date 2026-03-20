import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MenuPage from './MenuPages';
import { foodAPI } from '../services/api';
import { Provider } from '../components/ui/provider';
import { AppProvider } from '../context/AppContext';

// Mock matchMedia (Chakra UI / jsdom)
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

// Mock foodAPI
vi.mock('../services/api', () => ({
  foodAPI: {
    getPublicMenu: vi.fn(),
    getPublicCategories: vi.fn(),
  }
}));

const mockStore = {
  _id: 'tenant123',
  name: 'Pizzaria Calango',
  primaryColor: '#4CAF50',
  logoUrl: 'https://example.com/logo.png',
  operatingHours: [
    { day: 0, isActive: false, openTime: '18:00', closeTime: '23:00' },
    { day: 1, isActive: true, openTime: '18:00', closeTime: '23:59' },
    { day: 2, isActive: true, openTime: '18:00', closeTime: '23:59' },
    { day: 3, isActive: true, openTime: '18:00', closeTime: '23:59' },
    { day: 4, isActive: true, openTime: '18:00', closeTime: '23:59' },
    { day: 5, isActive: true, openTime: '11:00', closeTime: '23:59' },
    { day: 6, isActive: true, openTime: '11:00', closeTime: '23:59' },
  ],
};

const mockProducts = [
  { _id: 'p1', name: 'Pizza Calabresa', description: 'Massa artesanal', price: 49.90, category: 'Pizzas', imageUrl: 'https://example.com/pizza.jpg', isAvailable: true, attributeGroups: [] },
  { _id: 'p2', name: 'Guaraná 2L', description: 'Gelado', price: 12.00, category: 'Bebidas', imageUrl: '', isAvailable: true, attributeGroups: [] },
  { _id: 'p3', name: 'Coca-Cola 2L', description: 'Lata', price: 9.00, category: 'Bebidas', imageUrl: '', isAvailable: true, attributeGroups: [] },
];

const mockCategories = [
  { _id: 'c1', name: 'Pizzas', order: 0 },
  { _id: 'c2', name: 'Bebidas', order: 1 },
];

const renderMenuPage = (slug = 'pizzaria-calango') => {
  return render(
    <Provider>
      <AppProvider>
        <MemoryRouter initialEntries={[`/cardapio/${slug}`]}>
          <Routes>
            <Route path="/cardapio/:slug" element={<MenuPage />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </Provider>
  );
};

describe('MenuPage (Cardápio Público)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    foodAPI.getPublicMenu.mockResolvedValue({
      data: { store: mockStore, menuItems: mockProducts }
    });
    foodAPI.getPublicCategories.mockResolvedValue({ data: mockCategories });
  });

  it('renders the restaurant name and products after loading', async () => {
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Pizzaria Calango')).toBeDefined();
    });

    expect(screen.getByText('Pizza Calabresa')).toBeDefined();
    expect(screen.getByText('Guaraná 2L')).toBeDefined();
    expect(screen.getByText('Coca-Cola 2L')).toBeDefined();
  });

  it('groups products by category', async () => {
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Pizzas')).toBeDefined();
    });

    expect(screen.getByText('Bebidas')).toBeDefined();
  });

  it('calls getPublicMenu with the correct slug', async () => {
    renderMenuPage('meu-restaurante');

    await waitFor(() => {
      expect(foodAPI.getPublicMenu).toHaveBeenCalledWith('meu-restaurante');
    });
  });

  it('calls getPublicCategories to fetch category order', async () => {
    renderMenuPage();

    await waitFor(() => {
      expect(foodAPI.getPublicCategories).toHaveBeenCalledWith('tenant123');
    });
  });

  it('shows "Restaurante não encontrado" when API fails', async () => {
    foodAPI.getPublicMenu.mockRejectedValue(new Error('Network Error'));

    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Restaurante não encontrado.')).toBeDefined();
    });
  });

  it('displays product prices formatted in BRL', async () => {
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('R$ 49.90')).toBeDefined();
    });

    expect(screen.getByText('R$ 12.00')).toBeDefined();
  });

  it('renders ADICIONAR buttons for each product', async () => {
    renderMenuPage();

    await waitFor(() => {
      const addButtons = screen.getAllByText('ADICIONAR');
      expect(addButtons.length).toBe(mockProducts.length);
    });
  });
});
