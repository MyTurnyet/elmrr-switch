/**
 * CarOrderManagement Page Tests
 * 
 * Tests the CarOrderManagement page component:
 * - Order list display with DataGrid
 * - Statistics cards
 * - Filtering (industry, status, session, car type)
 * - Generate orders dialog
 * - Delete order confirmation
 * - Status-based actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CarOrderManagement from '../CarOrderManagement';
import { AppProvider } from '../../contexts/AppContext';
import { apiService } from '../../services/api';

// Mock DataGrid to avoid CSS import issues
vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({ rows, columns }: any) => (
    <div role="grid">
      {rows.map((row: any) => (
        <div key={row._id || row.id}>
          {columns.map((col: any) => {
            if (col.field === 'actions') return null;
            const value = col.valueGetter ? col.valueGetter(null, row) : row[col.field];
            return <div key={col.field}>{col.renderCell ? col.renderCell({ value, row }) : value}</div>;
          })}
        </div>
      ))}
    </div>
  ),
  GridColDef: {} as any,
}));

// Mock apiService
vi.mock('../../services/api', () => ({
  apiService: {
    getCars: vi.fn(),
    getLocomotives: vi.fn(),
    getIndustries: vi.fn(),
    getStations: vi.fn(),
    getGoods: vi.fn(),
    getAarTypes: vi.fn(),
    getBlocks: vi.fn(),
    getTracks: vi.fn(),
    getRoutes: vi.fn(),
    getCurrentSession: vi.fn(),
    getTrains: vi.fn(),
    getCarOrders: vi.fn(),
    generateCarOrders: vi.fn(),
    deleteCarOrder: vi.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>{component}</AppProvider>
    </BrowserRouter>
  );
};

describe('CarOrderManagement Page', () => {
  const mockSession = {
    _id: 'session1',
    currentSessionNumber: 1,
    sessionDate: '2025-10-28T14:00:00.000Z',
    previousSessionSnapshot: null,
  };

  const mockIndustries = [
    { _id: 'ind1', id: 'ind1', name: 'Lumber Mill', stationId: 'station1' },
    { _id: 'ind2', id: 'ind2', name: 'Coal Mine', stationId: 'station2' },
  ];

  const mockAarTypes = [
    { _id: 'aar1', id: 'aar1', code: 'XM', description: 'Boxcar' },
    { _id: 'aar2', id: 'aar2', code: 'FM', description: 'Flatcar' },
  ];

  const mockCars = [
    { _id: 'car1', id: 'car1', reportingMarks: 'UP', reportingNumber: '1234', carType: 'aar1' },
  ];

  const mockTrains = [
    { _id: 'train1', id: 'train1', name: 'Portland Local', status: 'In Progress' },
  ];

  const mockOrders = [
    {
      _id: 'order1',
      id: 'order1',
      industryId: 'ind1',
      aarTypeId: 'aar1',
      sessionNumber: 1,
      status: 'pending' as const,
      createdAt: '2025-10-28T14:00:00.000Z',
    },
    {
      _id: 'order2',
      id: 'order2',
      industryId: 'ind2',
      aarTypeId: 'aar2',
      sessionNumber: 1,
      status: 'assigned' as const,
      assignedCarId: 'car1',
      assignedTrainId: 'train1',
      createdAt: '2025-10-28T14:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiService.getCars as any).mockResolvedValue({ data: mockCars });
    (apiService.getLocomotives as any).mockResolvedValue({ data: [] });
    (apiService.getIndustries as any).mockResolvedValue({ data: mockIndustries });
    (apiService.getStations as any).mockResolvedValue({ data: [] });
    (apiService.getGoods as any).mockResolvedValue({ data: [] });
    (apiService.getAarTypes as any).mockResolvedValue({ data: mockAarTypes });
    (apiService.getBlocks as any).mockResolvedValue({ data: [] });
    (apiService.getTracks as any).mockResolvedValue({ data: [] });
    (apiService.getRoutes as any).mockResolvedValue({ data: [] });
    (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
    (apiService.getTrains as any).mockResolvedValue({ data: mockTrains });
    (apiService.getCarOrders as any).mockResolvedValue({ data: mockOrders });
  });

  describe('Order List Display', () => {
    it('should display DataGrid', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    it('should display status chips', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        const grid = screen.getByRole('grid');
        expect(within(grid).getByText('pending')).toBeInTheDocument();
        expect(within(grid).getByText('assigned')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display order statistics', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Assigned')).toBeInTheDocument();
        expect(screen.getByText('In Transit')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
      });
    });

    it('should show correct counts', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        const statsCards = screen.getAllByRole('heading', { level: 4 });
        const counts = statsCards.map(card => card.textContent);
        expect(counts).toContain('2'); // Total
        expect(counts).toContain('1'); // Pending
        expect(counts).toContain('1'); // Assigned
      });
    });
  });

  describe('Filtering', () => {
    it('should display filter controls', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Generate Orders', () => {
    it('should open generate orders dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Car Order Management')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate orders/i });
      await user.click(generateButton);

      expect(screen.getByText('Generate Car Orders')).toBeInTheDocument();
    });

    it('should have form fields in generate dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Car Order Management')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate orders/i });
      await user.click(generateButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByLabelText(/session number/i)).toBeInTheDocument();
      });
    });

    it('should call generateCarOrders on confirmation', async () => {
      const user = userEvent.setup();
      (apiService.generateCarOrders as any).mockResolvedValue({ 
        data: { totalOrders: 5, byIndustry: {}, byAarType: {} } 
      });

      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Car Order Management')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate orders/i });
      await user.click(generateButton);

      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /^generate$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiService.generateCarOrders).toHaveBeenCalled();
      });
    });
  });


  describe('Refresh', () => {
    it('should have refresh button', async () => {
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should call fetchCarOrders on refresh', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CarOrderManagement />);

      await waitFor(() => {
        expect(screen.getByText('Car Order Management')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Clear previous calls
      vi.clearAllMocks();
      
      await user.click(refreshButton);

      await waitFor(() => {
        expect(apiService.getCarOrders).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      (apiService.getCarOrders as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<CarOrderManagement />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
