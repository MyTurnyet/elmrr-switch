/**
 * Dashboard Page Tests
 * 
 * Tests the Dashboard page component:
 * - Statistics display
 * - Session info card
 * - Train operations card
 * - Car orders card
 * - Quick actions
 * - Navigation links
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AppProvider } from '../../contexts/AppContext';
import { apiService } from '../../services/api';

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
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>{component}</AppProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  const mockSession = {
    _id: 'session1',
    currentSessionNumber: 2,
    sessionDate: '2025-10-28T14:00:00.000Z',
    description: 'Test Session',
    previousSessionSnapshot: {},
  };

  const mockCars = [
    { _id: 'car1', reportingMarks: 'UP', reportingNumber: '1234', isInService: true, carType: 'aar1' },
    { _id: 'car2', reportingMarks: 'SP', reportingNumber: '5678', isInService: false, carType: 'aar2' },
  ];

  const mockLocomotives = [
    { _id: 'loco1', reportingMarks: 'UP', reportingNumber: '100', isInService: true },
  ];

  const mockIndustries = [
    { _id: 'ind1', name: 'Lumber Mill', stationId: 'station1' },
  ];

  const mockRoutes = [
    { _id: 'route1', name: 'Portland Local', origin: 'station1', termination: 'station2' },
  ];

  const mockTrains = [
    { _id: 'train1', name: 'Train 1', sessionNumber: 2, status: 'Planned', routeId: 'route1' },
    { _id: 'train2', name: 'Train 2', sessionNumber: 2, status: 'In Progress', routeId: 'route1' },
    { _id: 'train3', name: 'Train 3', sessionNumber: 2, status: 'Completed', routeId: 'route1' },
  ];

  const mockOrders = [
    { _id: 'order1', sessionNumber: 2, status: 'pending', industryId: 'ind1', aarTypeId: 'aar1' },
    { _id: 'order2', sessionNumber: 2, status: 'assigned', industryId: 'ind1', aarTypeId: 'aar2' },
    { _id: 'order3', sessionNumber: 2, status: 'delivered', industryId: 'ind1', aarTypeId: 'aar1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    (apiService.getCars as any).mockResolvedValue({ data: mockCars });
    (apiService.getLocomotives as any).mockResolvedValue({ data: mockLocomotives });
    (apiService.getIndustries as any).mockResolvedValue({ data: mockIndustries });
    (apiService.getStations as any).mockResolvedValue({ data: [] });
    (apiService.getGoods as any).mockResolvedValue({ data: [] });
    (apiService.getAarTypes as any).mockResolvedValue({ data: [] });
    (apiService.getBlocks as any).mockResolvedValue({ data: [] });
    (apiService.getTracks as any).mockResolvedValue({ data: [] });
    (apiService.getRoutes as any).mockResolvedValue({ data: mockRoutes });
    (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
    (apiService.getTrains as any).mockResolvedValue({ data: mockTrains });
    (apiService.getCarOrders as any).mockResolvedValue({ data: mockOrders });
  });

  describe('Page Rendering', () => {
    it('should render dashboard title', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Session Info Card', () => {
    it('should display current session info', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Current Operating Session')).toBeInTheDocument();
        expect(screen.getByText('Session 2')).toBeInTheDocument();
        expect(screen.getByText('Test Session')).toBeInTheDocument();
      });
    });

    it('should have manage session button', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage session/i })).toBeInTheDocument();
      });
    });

    it('should navigate to sessions page when manage button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage session/i })).toBeInTheDocument();
      });

      const manageButton = screen.getByRole('button', { name: /manage session/i });
      await user.click(manageButton);

      expect(mockNavigate).toHaveBeenCalledWith('/sessions');
    });
  });

  describe('Statistics Cards', () => {
    it('should display statistics cards', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Cars')).toBeInTheDocument();
        expect(screen.getByText('Locomotives')).toBeInTheDocument();
        expect(screen.getByText('Industries')).toBeInTheDocument();
        expect(screen.getByText('Routes')).toBeInTheDocument();
      });
    });
  });

  describe('Train Operations Card', () => {
    it('should display train operations section', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Train Operations card should be visible
      await waitFor(() => {
        const trainElements = screen.queryAllByText(/train operations/i);
        expect(trainElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Car Orders Card', () => {
    it('should display car orders section', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Car Orders card should be visible
      await waitFor(() => {
        const orderElements = screen.queryAllByText(/car orders/i);
        expect(orderElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions section', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should have session management action', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /session management/i })).toBeInTheDocument();
      });
    });

    it('should have train operations action', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /train operations/i })).toBeInTheDocument();
      });
    });

    it('should have car orders action', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /car orders/i })).toBeInTheDocument();
      });
    });

    it('should navigate when quick action clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /train operations/i })).toBeInTheDocument();
      });

      const trainButton = screen.getByRole('button', { name: /train operations/i });
      await user.click(trainButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trains');
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity section', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      (apiService.getCars as any).mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
