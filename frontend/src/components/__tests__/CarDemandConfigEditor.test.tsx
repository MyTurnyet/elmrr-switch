/**
 * CarDemandConfigEditor Component Tests
 * 
 * Tests the CarDemandConfigEditor component:
 * - Rendering with empty and populated configurations
 * - Adding new demand configurations
 * - Editing existing configurations
 * - Deleting configurations
 * - Form validation
 * - Duplicate detection
 * - Goods and AAR type selection
 * - Direction selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarDemandConfigEditor } from '../CarDemandConfigEditor';
import type { CarDemandConfig } from '../../types';

describe('CarDemandConfigEditor', () => {
  const mockGoods = [
    { _id: 'lumber', name: 'Lumber', category: 'Forest Products' },
    { _id: 'coal', name: 'Coal', category: 'Minerals' },
    { _id: 'grain', name: 'Grain', category: 'Agriculture' },
  ];

  const mockAarTypes = [
    { _id: 'FB', code: 'FB', name: 'Flatcar - Bulkhead' },
    { _id: 'XM', code: 'XM', name: 'Boxcar - 50ft' },
    { _id: 'HT', code: 'HT', name: 'Hopper - 3-Bay' },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with empty configuration', () => {
      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      expect(screen.getByText('Car Demand Configuration')).toBeInTheDocument();
      expect(screen.getByText('Add Demand')).toBeInTheDocument();
      expect(screen.getByText(/No demand configuration/i)).toBeInTheDocument();
    });

    it('should render with existing configurations', () => {
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB', 'XM'],
          carsPerSession: 2,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      expect(screen.getByText('Lumber')).toBeInTheDocument();
      expect(screen.getByText('INBOUND')).toBeInTheDocument();
      expect(screen.getByText(/FB, XM/)).toBeInTheDocument();
      expect(screen.getByText(/2 car\(s\) every 1 session\(s\)/)).toBeInTheDocument();
    });

    it('should show both inbound and outbound configurations', () => {
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 2,
          frequency: 1,
        },
        {
          goodsId: 'lumber',
          direction: 'outbound',
          compatibleCarTypes: ['XM'],
          carsPerSession: 1,
          frequency: 2,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      expect(screen.getAllByText('Lumber')).toHaveLength(2);
      expect(screen.getByText('INBOUND')).toBeInTheDocument();
      expect(screen.getByText('OUTBOUND')).toBeInTheDocument();
    });
  });

  describe('Adding Configurations', () => {
    it('should open dialog when Add Demand is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));

      expect(screen.getByText('Add Demand Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/Good\/Commodity/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Direction/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Compatible Car Types/)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));
      
      // Clear the default values to trigger validation
      const carsInput = screen.getByLabelText(/Cars Per Session/);
      await user.clear(carsInput);
      
      await user.click(screen.getByRole('button', { name: /^Add$/i }));

      // Should show validation errors (validation happens on save)
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should detect duplicate goods + direction combinations', async () => {
      const user = userEvent.setup();
      const existingConfig: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 1,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={existingConfig}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));
      
      // Try to add duplicate
      const goodsSelect = screen.getByLabelText(/Good\/Commodity/);
      await user.click(goodsSelect);
      await user.click(screen.getByRole('option', { name: /Lumber/ }));

      // Select a car type
      const carTypeSelect = screen.getByLabelText(/Compatible Car Types/);
      await user.click(carTypeSelect);
      await user.click(screen.getByRole('option', { name: /FB/ }));

      // Direction should default to inbound
      await user.click(screen.getByRole('button', { name: /^Add$/i }));

      // Validation should prevent duplicate, onChange not called
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should allow same good with different direction', async () => {
      const user = userEvent.setup();
      const existingConfig: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 1,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={existingConfig}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));
      
      // Select lumber
      const goodsSelect = screen.getByLabelText(/Good\/Commodity/);
      await user.click(goodsSelect);
      await user.click(screen.getByRole('option', { name: /Lumber/ }));

      // Change direction to outbound
      const directionSelect = screen.getByLabelText(/Direction/);
      await user.click(directionSelect);
      await user.click(screen.getByRole('option', { name: /Outbound/ }));

      // Select car type
      const carTypeSelect = screen.getByLabelText(/Compatible Car Types/);
      await user.click(carTypeSelect);
      await user.click(screen.getByRole('option', { name: /XM/ }));

      await user.click(screen.getByRole('button', { name: /^Add$/i }));

      // Should call onChange with new config
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            goodsId: 'lumber',
            direction: 'outbound',
          }),
        ])
      );
    });
  });

  describe('Editing Configurations', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 2,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      const editButton = screen.getByLabelText('Edit');
      await user.click(editButton);

      expect(screen.getByText('Edit Demand Configuration')).toBeInTheDocument();
      // Should have pre-filled values
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should update configuration when saved', async () => {
      const user = userEvent.setup();
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 2,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByLabelText('Edit'));

      // Change cars per session
      const carsInput = screen.getByLabelText(/Cars Per Session/);
      await user.clear(carsInput);
      await user.type(carsInput, '3');

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          carsPerSession: 3,
        }),
      ]);
    });
  });

  describe('Deleting Configurations', () => {
    it('should delete configuration when delete button is clicked', async () => {
      const user = userEvent.setup();
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 2,
          frequency: 1,
        },
        {
          goodsId: 'coal',
          direction: 'inbound',
          compatibleCarTypes: ['HT'],
          carsPerSession: 1,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          goodsId: 'coal',
        }),
      ]);
    });
  });

  describe('Validation', () => {
    it('should validate minimum cars per session', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));

      const carsInput = screen.getByLabelText(/Cars Per Session/);
      await user.clear(carsInput);
      await user.type(carsInput, '0');

      await user.click(screen.getByRole('button', { name: /^Add$/i }));

      // Validation prevents save, onChange not called
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should validate minimum frequency', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));

      const frequencyInput = screen.getByLabelText(/Frequency/);
      await user.clear(frequencyInput);
      await user.type(frequencyInput, '0');

      await user.click(screen.getByRole('button', { name: /^Add$/i }));

      // Validation prevents save, onChange not called
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable add button when disabled prop is true', () => {
      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
          disabled={true}
        />
      );

      const addButton = screen.getByText('Add Demand');
      expect(addButton).toBeDisabled();
    });

    it('should disable edit and delete buttons when disabled', () => {
      const config: CarDemandConfig[] = [
        {
          goodsId: 'lumber',
          direction: 'inbound',
          compatibleCarTypes: ['FB'],
          carsPerSession: 2,
          frequency: 1,
        },
      ];

      render(
        <CarDemandConfigEditor
          value={config}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
          disabled={true}
        />
      );

      expect(screen.getByLabelText('Edit')).toBeDisabled();
      expect(screen.getByLabelText('Delete')).toBeDisabled();
    });
  });

  describe('Dialog Interactions', () => {
    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));
      expect(screen.getByText('Add Demand Configuration')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Cancel/i }));
      
      // Dialog should close (may need time for animation)
      await new Promise(resolve => setTimeout(resolve, 300));
      expect(screen.queryByText('Add Demand Configuration')).not.toBeInTheDocument();
    });

    it('should reset form when dialog is closed', async () => {
      const user = userEvent.setup();

      render(
        <CarDemandConfigEditor
          value={[]}
          onChange={mockOnChange}
          goods={mockGoods}
          aarTypes={mockAarTypes}
        />
      );

      await user.click(screen.getByText('Add Demand'));
      
      // Make some changes
      const carsInput = screen.getByLabelText(/Cars Per Session/);
      await user.clear(carsInput);
      await user.type(carsInput, '5');

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      // Open again
      await user.click(screen.getByText('Add Demand'));

      // Should be reset to default
      expect(screen.getByLabelText(/Cars Per Session/)).toHaveValue(1);
    });
  });
});
