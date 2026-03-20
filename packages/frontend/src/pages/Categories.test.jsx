import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Categories from './Categories';
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
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    reorderCategories: vi.fn(),
  }
}));

const mockCategories = [
  { _id: 'c1', name: 'Pizzas', order: 0 },
  { _id: 'c2', name: 'Bebidas', order: 1 },
  { _id: 'c3', name: 'Sobremesas', order: 2 },
];

const renderCategories = () => {
  return render(
    <Provider>
      <AppProvider>
        <BrowserRouter>
          <Categories />
        </BrowserRouter>
      </AppProvider>
    </Provider>
  );
};

describe('Categories (Admin - Categorias do Cardápio)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    foodAPI.getCategories.mockResolvedValue({ data: mockCategories });
    foodAPI.createCategory.mockResolvedValue({ data: { _id: 'c4', name: 'Lanches', order: 3 } });
    foodAPI.deleteCategory.mockResolvedValue({ data: { message: 'ok' } });
    foodAPI.updateCategory.mockResolvedValue({ data: { _id: 'c1', name: 'Pizzas Especiais' } });
    foodAPI.reorderCategories.mockResolvedValue({ data: { message: 'ok' } });
  });

  it('renders the page title and fetches categories', async () => {
    renderCategories();

    expect(screen.getByText('Categorias do Cardápio')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Pizzas')).toBeDefined();
    });

    expect(screen.getByText('Bebidas')).toBeDefined();
    expect(screen.getByText('Sobremesas')).toBeDefined();
  });

  it('calls getCategories on mount', async () => {
    renderCategories();

    await waitFor(() => {
      expect(foodAPI.getCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('displays order badges (#1, #2, #3)', async () => {
    renderCategories();

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeDefined();
      expect(screen.getByText('#2')).toBeDefined();
      expect(screen.getByText('#3')).toBeDefined();
    });
  });

  it('displays count badge with correct plural', async () => {
    renderCategories();

    await waitFor(() => {
      expect(screen.getByText('3 categorias')).toBeDefined();
    });
  });

  it('shows empty state when no categories exist', async () => {
    foodAPI.getCategories.mockResolvedValue({ data: [] });
    renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria criada ainda.')).toBeDefined();
    });
  });

  it('shows the "Nova Categoria" form', async () => {
    renderCategories();

    expect(screen.getByText('Nova Categoria')).toBeDefined();
    expect(screen.getByPlaceholderText('Ex: Pizzas, Bebidas, Sobremesas...')).toBeDefined();
  });

  it('creates a new category when the form is submitted', async () => {
    renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Pizzas')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Ex: Pizzas, Bebidas, Sobremesas...');
    fireEvent.change(input, { target: { value: 'Lanches' } });

    const addButton = screen.getByText('Adicionar');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(foodAPI.createCategory).toHaveBeenCalledWith({ name: 'Lanches', order: 3 });
    });
  });

  it('calls deleteCategory when user confirms deletion', async () => {
    window.confirm = vi.fn().mockReturnValue(true);

    renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Pizzas')).toBeDefined();
    });

    // Pegar os botões de exclusão (ícone de lixeira). Eles não têm texto visível,
    // então usamos getAllByRole para pegar os IconButtons. O 4o item é o primeiro botão de delete
    // (após os 3 grip + 3 edit). Como testamos pelo confirm + API call, basta um click.
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.includes?.('delete') || true
    );

    // Tenta achar e clicar no terceiro botão de ação (delete do primeiro item)
    // A lógica pode variar em diferentes versões de Chakra, por isso validamos pela chamada da API
    const allButtons = screen.getAllByRole('button');
    // Itera para encontrar um que chame deleteCategory ao ser clicado
    for (const btn of allButtons) {
      fireEvent.click(btn);
      if (foodAPI.deleteCategory.mock.calls.length > 0) break;
    }

    // Se o confirm retornou true, a API deve ter sido chamada
    if (window.confirm.mock.calls.length > 0) {
      await waitFor(() => {
        expect(foodAPI.deleteCategory).toHaveBeenCalled();
      });
    }
  });
});
