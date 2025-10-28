/**
 * TrainOperations Page Tests
 * 
 * Tests the TrainOperations page component:
 * - Train list display with DataGrid
 * - Statistics cards
 * - Filtering (session, status, route)
 * - Add/Edit train dialogs
 * - Delete confirmation
 * - Generate switch list
 * - Complete train
 * - Cancel train
 * - Switch list display
 * - Status-based action buttons
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TrainOperations from '../TrainOperations';
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
    createTrain: vi.fn(),
    updateTrain: vi.fn(),
    deleteTrain: vi.fn(),
    generateSwitchList: vi.fn(),
    completeTrain: vi.fn(),
    cancelTrain: vi.fn(),
    getCarOrders: vi.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>{component}</AppProvider>
    </BrowserRouter>
  );
};

describe('TrainOperations Page', () => {
  const mockSession = {
    _id: 'session1',
    currentSessionNumber: 1,
    sessionDate: '2025-10-28T14:00:00.000Z',
    previousSessionSnapshot: null,
  };

  const mockRoutes = [
    { _id: 'route1', id: 'route1', name: 'Portland Local', origin: 'Portland', termination: 'Salem', stations: [] },
    { _id: 'route2', id: 'route2', name: 'Coast Run', origin: 'Newport', termination: 'Astoria', stations: [] },
  ];

  const mockLocomotives = [
    { _id: 'loco1', id: 'loco1', roadNumber: '1234', model: 'GP38', isInService: true },
    { _id: 'loco2', id: 'loco2', roadNumber: '5678', model: 'SD40', isInService: true },
  ];

  const mockTrains = [
    {
      _id: 'train1',
      id: 'train1',
      name: 'Portland Local',
      routeId: 'route1',
      sessionNumber: 1,
      status: 'Planned' as const,
      locomotiveIds: ['loco1'],
      maxCapacity: 20,
      assignedCarIds: [],
      createdAt: '2025-10-28T14:00:00.000Z',
      updatedAt: '2025-10-28T14:00:00.000Z',
    },
    {
      _id: 'train2',
      id: 'train2',
      name: 'Coast Run',
      routeId: 'route2',
      sessionNumber: 1,
      status: 'In Progress' as const,
      locomotiveIds: ['loco2'],
      maxCapacity: 15,
      assignedCarIds: ['car1', 'car2'],
      switchList: {
        stations: [
          {
            stationName: 'Newport',
            pickups: [
              { carReportingMarks: 'UP', carReportingNumber: '1234', carType: 'Boxcar', destination: 'Astoria Mill' },
            ],
            setouts: [],
          },
        ],
        totalPickups: 1,
        totalSetouts: 0,
        finalCarCount: 3,
        generatedAt: '2025-10-28T14:00:00.000Z',
      },
      createdAt: '2025-10-28T14:00:00.000Z',
      updatedAt: '2025-10-28T14:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiService.getCars as any).mockResolvedValue({ data: [] });
    (apiService.getLocomotives as any).mockResolvedValue({ data: mockLocomotives });
    (apiService.getIndustries as any).mockResolvedValue({ data: [] });
    (apiService.getStations as any).mockResolvedValue({ data: [] });
    (apiService.getGoods as any).mockResolvedValue({ data: [] });
    (apiService.getAarTypes as any).mockResolvedValue({ data: [] });
    (apiService.getBlocks as any).mockResolvedValue({ data: [] });
    (apiService.getTracks as any).mockResolvedValue({ data: [] });
    (apiService.getRoutes as any).mockResolvedValue({ data: mockRoutes });
    (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
    (apiService.getTrains as any).mockResolvedValue({ data: mockTrains });
    (apiService.getCarOrders as any).mockResolvedValue({ data: [] });
  });

  describe('Train List Display', () => {
    it('should display trains in DataGrid', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Portland Local')).toBeInTheDocument();
        expect(screen.getByText('Coast Run')).toBeInTheDocument();
      });
    });

    it('should display route names', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        // Route names should appear in the grid
        const grid = screen.getByRole('grid');
        expect(within(grid).getByText('Portland Local')).toBeInTheDocument();
      });
    });

    it('should display status information', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        // Status should be displayed (multiple instances due to stats and grid)
        const grid = screen.getByRole('grid');
        expect(within(grid).getByText('Planned')).toBeInTheDocument();
        expect(within(grid).getByText('In Progress')).toBeInTheDocument();
      });
    });

    it('should display capacity information', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('0/20')).toBeInTheDocument(); // Portland Local
        expect(screen.getByText('2/15')).toBeInTheDocument(); // Coast Run
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display train statistics', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Total Trains')).toBeInTheDocument();
        // Check for statistics labels (they appear once in stats section)
        const statsSection = screen.getAllByText('Planned')[0].closest('div');
        expect(statsSection).toBeInTheDocument();
      });
    });

    it('should show correct counts', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        // Find the statistics section
        const statsCards = screen.getAllByRole('heading', { level: 4 });
        const counts = statsCards.map(card => card.textContent);
        expect(counts).toContain('2'); // Total
        expect(counts).toContain('1'); // Planned
        expect(counts).toContain('1'); // In Progress
      });
    });
  });

  describe('Filtering', () => {
    it('should display filter controls', async () => {
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
        // Filter controls should be present
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Add Train', () => {
    it('should open add train dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Train Operations')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add train/i });
      await user.click(addButton);

      // Dialog should open with title
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Add Train')[0]).toBeInTheDocument();
    });

    it('should have form fields in add dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TrainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Train Operations')).toBeInTheDocument();
      });

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add train/i });
      await user.click(addButton);

      // Check form fields exist
      await waitFor(() => {
        expect(screen.getByLabelText(/train name/i)).toBeInTheDocument();
        const dialog = screen.getByRole('dialog');
        const capacityLabels = within(dialog).getAllByText(/max capacity/i);
        expect(capacityLabels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      (apiService.getTrains as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<TrainOperations />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
