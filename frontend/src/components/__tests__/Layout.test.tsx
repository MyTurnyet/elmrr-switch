/**
 * Layout Component Tests
 * 
 * Tests the Layout component:
 * - Navigation menu rendering
 * - Menu sections (Dashboard, Operations, Setup)
 * - Active route highlighting
 * - Mobile drawer functionality
 * - Navigation clicks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render layout with children', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </BrowserRouter>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should display app title', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      expect(screen.getByText('Model Railroad Layout Tracking System')).toBeInTheDocument();
    });

    it('should display ELMRR branding', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const elmrrElements = screen.getAllByText('ELMRR');
      expect(elmrrElements.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Menu', () => {
    it('should display dashboard menu item', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const dashboardElements = screen.getAllByText('Dashboard');
      expect(dashboardElements.length).toBeGreaterThan(0);
    });

    it('should display operations section', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const operationsElements = screen.getAllByText('Operations');
      expect(operationsElements.length).toBeGreaterThan(0);
      
      const sessionElements = screen.getAllByText('Session Management');
      expect(sessionElements.length).toBeGreaterThan(0);
    });

    it('should display setup section', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const setupElements = screen.getAllByText('Setup');
      expect(setupElements.length).toBeGreaterThan(0);
      
      const carElements = screen.getAllByText('Car Management');
      expect(carElements.length).toBeGreaterThan(0);
    });
  });

  describe('Active Route Highlighting', () => {
    it('should highlight dashboard when on root path', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout>
            <div>Content</div>
          </Layout>
        </MemoryRouter>
      );

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      expect(dashboardButton).toHaveClass('Mui-selected');
    });

    it('should highlight sessions when on sessions path', () => {
      render(
        <MemoryRouter initialEntries={['/sessions']}>
          <Layout>
            <div>Content</div>
          </Layout>
        </MemoryRouter>
      );

      const sessionsButton = screen.getByRole('button', { name: /session management/i });
      expect(sessionsButton).toHaveClass('Mui-selected');
    });

    it('should highlight trains when on trains path', () => {
      render(
        <MemoryRouter initialEntries={['/trains']}>
          <Layout>
            <div>Content</div>
          </Layout>
        </MemoryRouter>
      );

      const trainsButton = screen.getByRole('button', { name: /train operations/i });
      expect(trainsButton).toHaveClass('Mui-selected');
    });

    it('should highlight orders when on orders path', () => {
      render(
        <MemoryRouter initialEntries={['/orders']}>
          <Layout>
            <div>Content</div>
          </Layout>
        </MemoryRouter>
      );

      const ordersButton = screen.getByRole('button', { name: /car orders/i });
      expect(ordersButton).toHaveClass('Mui-selected');
    });
  });

  describe('Navigation Clicks', () => {
    it('should navigate to dashboard when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to sessions when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const sessionsButton = screen.getByRole('button', { name: /session management/i });
      await user.click(sessionsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/sessions');
    });

    it('should navigate to trains when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const trainsButton = screen.getByRole('button', { name: /train operations/i });
      await user.click(trainsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trains');
    });

    it('should navigate to orders when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const ordersButton = screen.getByRole('button', { name: /car orders/i });
      await user.click(ordersButton);

      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('should navigate to cars when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const carsButton = screen.getByRole('button', { name: /car management/i });
      await user.click(carsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/cars');
    });

    it('should navigate to industries when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const industriesButton = screen.getByRole('button', { name: /industries/i });
      await user.click(industriesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/industries');
    });

    it('should navigate to routes when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const routesButton = screen.getByRole('button', { name: /^routes$/i });
      await user.click(routesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/routes');
    });

    it('should navigate to import when clicked', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const importButton = screen.getByRole('button', { name: /data import/i });
      await user.click(importButton);

      expect(mockNavigate).toHaveBeenCalledWith('/import');
    });
  });

  describe('Menu Structure', () => {
    it('should have all menu items', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const menuItems = [
        'Dashboard',
        'Session Management',
        'Train Operations',
        'Car Orders',
        'Car Management',
        'Industries',
        'Routes',
        'Data Import',
      ];

      menuItems.forEach(item => {
        const elements = screen.getAllByText(item);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should have section headers', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      );

      const operationsElements = screen.getAllByText('Operations');
      expect(operationsElements.length).toBeGreaterThan(0);
      
      const setupElements = screen.getAllByText('Setup');
      expect(setupElements.length).toBeGreaterThan(0);
    });
  });
});
