import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from './Products';
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
    getProducts: vi.fn(),
    getCategories: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  }
}));

const mockProducts = [
  { _id: 'p1', name: 'Pizza Calabresa', description: 'Tradicional', price: 45.90, category: 'Pizzas', imageUrl: '', isAvailable: true, attributeGroups: [] },
  { _id: 'p2', name: 'Coca-Cola 2L', description: 'Gelada', price: 12.00, category: 'Bebidas', imageUrl: '', isAvailable: false, attributeGroups: [] },
];

const mockCategories = [
  { _id: 'c1', name: 'Pizzas', order: 0 },
  { _id: 'c2', name: 'Bebidas', order: 1 },
];

const renderProducts = () => {
  return render(
    <Provider>
      <AppProvider>
        <BrowserRouter>
          <Products />
        </BrowserRouter>
      </AppProvider>
    </Provider>
  );
};

describe('Products (Admin - Cardápio)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    foodAPI.getProducts.mockResolvedValue({ data: mockProducts });
    foodAPI.getCategories.mockResolvedValue({ data: mockCategories });
  });

  it('renders the page title and fetches products', async () => {
    renderProducts();

    expect(screen.getByText('Cardápio Inteligente')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Pizza Calabresa')).toBeDefined();
    });

    expect(screen.getByText('Coca-Cola 2L')).toBeDefined();
  });

  it('calls getProducts and getCategories on mount', async () => {
    renderProducts();

    await waitFor(() => {
      expect(foodAPI.getProducts).toHaveBeenCalledTimes(1);
      expect(foodAPI.getCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('displays product categories as badges', async () => {
    renderProducts();

    await waitFor(() => {
      expect(screen.getByText('Pizza Calabresa')).toBeDefined();
    });

    // Ambas as categorias devem aparecer como texto na tabela
    const pizzasTexts = screen.getAllByText('Pizzas');
    expect(pizzasTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the "+ Novo Produto" button', async () => {
    renderProducts();

    expect(screen.getByText('Novo Produto')).toBeDefined();
  });

  it('shows product prices in the table', async () => {
    renderProducts();

    await waitFor(() => {
      // Vitest's environment might not render fully with the new Intl.NumberFormat
      // Use standard regex matching to find the text node instead of exact matching
      const priceText = screen.getByText(/45[.,]90/);
      expect(priceText).toBeDefined();
    });

    expect(screen.getByText(/12[.,]00/)).toBeDefined();
  });
});
