/**
 * SessionManagement Page Tests
 * 
 * Tests the SessionManagement page component:
 * - Session information display
 * - Advance session functionality
 * - Rollback session functionality
 * - Description editing
 * - Loading states
 * - Error handling
 * - Confirmation dialogs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SessionManagement from '../SessionManagement';
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
    advanceSession: vi.fn(),
    rollbackSession: vi.fn(),
    updateSessionDescription: vi.fn(),
    getTrains: vi.fn(),
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

describe('SessionManagement Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiService.getCars as any).mockResolvedValue({ data: [] });
    (apiService.getLocomotives as any).mockResolvedValue({ data: [] });
    (apiService.getIndustries as any).mockResolvedValue({ data: [] });
    (apiService.getStations as any).mockResolvedValue({ data: [] });
    (apiService.getGoods as any).mockResolvedValue({ data: [] });
    (apiService.getAarTypes as any).mockResolvedValue({ data: [] });
    (apiService.getBlocks as any).mockResolvedValue({ data: [] });
    (apiService.getTracks as any).mockResolvedValue({ data: [] });
    (apiService.getRoutes as any).mockResolvedValue({ data: [] });
    (apiService.getTrains as any).mockResolvedValue({ data: [] });
    (apiService.getCarOrders as any).mockResolvedValue({ data: [] });
  });

  describe('Session Display', () => {
    it('should display current session information', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 3,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Test operating session',
        previousSessionSnapshot: {
          sessionNumber: 2,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 3')).toBeInTheDocument();
        expect(screen.getByText('Test operating session')).toBeInTheDocument();
      });
    });

    it('should display "No description" when description is empty', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('No description')).toBeInTheDocument();
      });
    });

    it('should format session date correctly', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        // Date formatting will vary by locale, just check it's displayed
        expect(screen.getByText(/October|2025/)).toBeInTheDocument();
      });
    });
  });

  describe('Description Editing', () => {
    it('should open description edit dialog', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Old description',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Old description')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Session Description')).toBeInTheDocument();
    });

    it('should update description', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Old description',
        previousSessionSnapshot: null,
      };
      const updatedSession = {
        ...mockSession,
        description: 'New description',
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
      (apiService.updateSessionDescription as any).mockResolvedValue({ data: updatedSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Old description')).toBeInTheDocument();
      });

      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update description - use the dialog to find the specific input
      const dialog = screen.getByRole('dialog');
      const input = within(dialog).getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New description');

      // Save
      const saveButton = within(dialog).getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiService.updateSessionDescription).toHaveBeenCalledWith('New description');
      });
    });

    it('should cancel description edit', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Old description',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Old description')).toBeInTheDocument();
      });

      // Open dialog
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Cancel
      const cancelButton = within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(apiService.updateSessionDescription).not.toHaveBeenCalled();
    });
  });

  describe('Advance Session', () => {
    it('should show advance confirmation dialog', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 2')).toBeInTheDocument();
      });

      const advanceButton = screen.getByRole('button', { name: /advance to next session/i });
      await user.click(advanceButton);

      expect(screen.getByText('Advance Session?')).toBeInTheDocument();
      expect(screen.getByText(/Advance to session 3/)).toBeInTheDocument();
    });

    it('should advance session on confirmation', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      const advancedSession = {
        ...mockSession,
        currentSessionNumber: 3,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
      (apiService.advanceSession as any).mockResolvedValue({ data: advancedSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 2')).toBeInTheDocument();
      });

      // Open confirmation
      const advanceButton = screen.getByRole('button', { name: /advance to next session/i });
      await user.click(advanceButton);

      // Confirm
      const dialogs = screen.getAllByRole('dialog');
      const confirmDialog = dialogs[dialogs.length - 1];
      const confirmButton = within(confirmDialog).getByRole('button', { name: /advance/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiService.advanceSession).toHaveBeenCalled();
      });
    });

    it('should cancel advance session', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 2')).toBeInTheDocument();
      });

      // Open confirmation
      const advanceButton = screen.getByRole('button', { name: /advance to next session/i });
      await user.click(advanceButton);

      // Cancel
      const dialogs = screen.getAllByRole('dialog');
      const confirmDialog = dialogs[dialogs.length - 1];
      const cancelButton = within(confirmDialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Advance Session?')).not.toBeInTheDocument();
      });

      expect(apiService.advanceSession).not.toHaveBeenCalled();
    });
  });

  describe('Rollback Session', () => {
    it('should disable rollback for session 1', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 1')).toBeInTheDocument();
      });

      const rollbackButton = screen.getByRole('button', { name: /rollback to previous session/i });
      expect(rollbackButton).toBeDisabled();
      expect(screen.getByText('Cannot rollback from session 1')).toBeInTheDocument();
    });

    it('should enable rollback when snapshot exists', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 2')).toBeInTheDocument();
      });

      const rollbackButton = screen.getByRole('button', { name: /rollback to previous session/i });
      expect(rollbackButton).not.toBeDisabled();
    });

    it('should show rollback confirmation dialog', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 3,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 2,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 3')).toBeInTheDocument();
      });

      const rollbackButton = screen.getByRole('button', { name: /rollback to previous session/i });
      await user.click(rollbackButton);

      expect(screen.getByText('Rollback Session?')).toBeInTheDocument();
      expect(screen.getByText(/Restore session 2/)).toBeInTheDocument();
    });

    it('should rollback session on confirmation', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 3,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 2,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      const rolledBackSession = {
        ...mockSession,
        currentSessionNumber: 2,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
      (apiService.rollbackSession as any).mockResolvedValue({ data: rolledBackSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 3')).toBeInTheDocument();
      });

      // Open confirmation
      const rollbackButton = screen.getByRole('button', { name: /rollback to previous session/i });
      await user.click(rollbackButton);

      // Confirm
      const dialogs = screen.getAllByRole('dialog');
      const confirmDialog = dialogs[dialogs.length - 1];
      const confirmButton = within(confirmDialog).getByRole('button', { name: /rollback/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiService.rollbackSession).toHaveBeenCalled();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner initially', () => {
      (apiService.getCurrentSession as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<SessionManagement />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable buttons while loading', async () => {
      const user = userEvent.setup();
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [],
          trains: [],
          carOrders: [],
        },
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });
      (apiService.advanceSession as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session 2')).toBeInTheDocument();
      });

      const advanceButton = screen.getByRole('button', { name: /advance to next session/i });
      await user.click(advanceButton);

      const dialogs = screen.getAllByRole('dialog');
      const confirmDialog = dialogs[dialogs.length - 1];
      const confirmButton = within(confirmDialog).getByRole('button', { name: /advance/i });
      await user.click(confirmButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        expect(advanceButton).toBeDisabled();
      });
    });
  });

  describe('Session Information', () => {
    it('should display session operations information', async () => {
      const mockSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };
      (apiService.getCurrentSession as any).mockResolvedValue({ data: mockSession });

      renderWithProviders(<SessionManagement />);

      await waitFor(() => {
        expect(screen.getByText('Session Operations')).toBeInTheDocument();
      });

      expect(screen.getByText(/Advance Session:/)).toBeInTheDocument();
      expect(screen.getByText(/Rollback Session:/)).toBeInTheDocument();
    });
  });
});
