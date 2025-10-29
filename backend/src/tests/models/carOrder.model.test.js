import { 
  validateCarOrder, 
  validateOrderGeneration,
  createOrderGenerationSummary,
  validateCarAssignment,
  checkDuplicateOrder,
  validateStatusTransition
} from '../../models/carOrder.js';

describe('Car Order Model Validation', () => {
  const validOrder = {
    industryId: 'lumber-mill',
    aarTypeId: 'flatcar',
    goodsId: 'lumber',
    direction: 'outbound',
    compatibleCarTypes: ['flatcar', 'centerbeam'],
    sessionNumber: 1,
    status: 'pending',
    assignedCarId: null,
    assignedTrainId: null,
    createdAt: new Date().toISOString()
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete car order object', () => {
      const { error } = validateCarOrder(validOrder);
      expect(error).toBeUndefined();
    });

    it('should require industryId', () => {
      const { error } = validateCarOrder({ ...validOrder, industryId: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('industryId');
    });

    it('should require aarTypeId', () => {
      const { error } = validateCarOrder({ ...validOrder, aarTypeId: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('aarTypeId');
    });

    it('should require sessionNumber', () => {
      const { error } = validateCarOrder({ ...validOrder, sessionNumber: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sessionNumber');
    });

    it('should require goodsId', () => {
      const { error } = validateCarOrder({ ...validOrder, goodsId: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('goodsId');
    });

    it('should require direction', () => {
      const { error } = validateCarOrder({ ...validOrder, direction: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('direction');
    });

    it('should validate direction enum values', () => {
      const { error } = validateCarOrder({ ...validOrder, direction: 'invalid' });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inbound');
    });

    it('should require compatibleCarTypes', () => {
      const { error } = validateCarOrder({ ...validOrder, compatibleCarTypes: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('compatibleCarTypes');
    });

    it('should require at least one compatible car type', () => {
      const { error } = validateCarOrder({ ...validOrder, compatibleCarTypes: [] });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1');
    });

    it('should default status to pending', () => {
      const { error, value } = validateCarOrder({
        industryId: 'test-industry',
        aarTypeId: 'boxcar',
        goodsId: 'general-merchandise',
        direction: 'inbound',
        compatibleCarTypes: ['boxcar'],
        sessionNumber: 1
      });
      expect(error).toBeUndefined();
      expect(value.status).toBe('pending');
    });

    it('should auto-set createdAt if not provided', () => {
      const { error, value } = validateCarOrder({
        industryId: 'test-industry',
        aarTypeId: 'boxcar',
        goodsId: 'general-merchandise',
        direction: 'inbound',
        compatibleCarTypes: ['boxcar'],
        sessionNumber: 1
      });
      expect(error).toBeUndefined();
      expect(value.createdAt).toBeDefined();
      expect(new Date(value.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce minimum session number of 1', () => {
      const { error } = validateCarOrder({
        ...validOrder,
        sessionNumber: 0
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce session number as integer', () => {
      const { error } = validateCarOrder({
        ...validOrder,
        sessionNumber: 1.5
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('integer');
    });

    it('should validate status enum values', () => {
      const { error } = validateCarOrder({
        ...validOrder,
        status: 'invalid-status'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('pending');
    });

    it('should allow valid status values', () => {
      const validStatuses = ['pending', 'assigned', 'in-transit', 'delivered'];
      
      validStatuses.forEach(status => {
        const { error } = validateCarOrder({
          ...validOrder,
          status
        });
        expect(error).toBeUndefined();
      });
    });

    it('should allow null assignedCarId and assignedTrainId', () => {
      const { error } = validateCarOrder({
        ...validOrder,
        assignedCarId: null,
        assignedTrainId: null
      });
      expect(error).toBeUndefined();
    });

    it('should validate string length constraints', () => {
      const longString = 'a'.repeat(101);
      
      const { error: industryError } = validateCarOrder({
        ...validOrder,
        industryId: longString
      });
      expect(industryError).toBeDefined();

      const { error: aarError } = validateCarOrder({
        ...validOrder,
        aarTypeId: 'a'.repeat(51)
      });
      expect(aarError).toBeDefined();
    });
  });

  describe('Validation - Update Mode', () => {
    it('should allow partial updates with all fields optional', () => {
      const { error } = validateCarOrder({
        status: 'assigned'
      }, true);
      expect(error).toBeUndefined();
    });

    it('should still enforce constraints in update mode', () => {
      const { error } = validateCarOrder({
        sessionNumber: 0
      }, true);
      expect(error).toBeDefined();
    });
  });

  describe('Validation - Custom _id Support', () => {
    it('should allow custom _id for seed data', () => {
      const { error } = validateCarOrder({
        ...validOrder,
        _id: 'custom-order-id'
      });
      expect(error).toBeUndefined();
    });

    it('should make _id optional', () => {
      const { error } = validateCarOrder(validOrder);
      expect(error).toBeUndefined();
    });
  });

  describe('Order Generation Validation', () => {
    it('should validate order generation request', () => {
      const { error } = validateOrderGeneration({
        sessionNumber: 5,
        industryIds: ['industry1', 'industry2'],
        force: true
      });
      expect(error).toBeUndefined();
    });

    it('should allow empty order generation request', () => {
      const { error } = validateOrderGeneration({});
      expect(error).toBeUndefined();
    });

    it('should default force to false', () => {
      const { error, value } = validateOrderGeneration({});
      expect(error).toBeUndefined();
      expect(value.force).toBe(false);
    });

    it('should validate sessionNumber constraints', () => {
      const { error } = validateOrderGeneration({
        sessionNumber: 0
      });
      expect(error).toBeDefined();
    });

    it('should validate industryIds as array of strings', () => {
      const { error } = validateOrderGeneration({
        industryIds: ['valid-id', 123] // Invalid: number in array
      });
      expect(error).toBeDefined();
    });
  });

  describe('Order Generation Summary', () => {
    const mockOrders = [
      { industryId: 'industry1', aarTypeId: 'boxcar' },
      { industryId: 'industry1', aarTypeId: 'flatcar' },
      { industryId: 'industry2', aarTypeId: 'boxcar' }
    ];

    const mockIndustryDemands = [
      { industryId: 'industry1', demandConfigs: 2 },
      { industryId: 'industry2', demandConfigs: 1 }
    ];

    it('should create correct summary structure', () => {
      const summary = createOrderGenerationSummary(mockOrders, mockIndustryDemands);
      
      expect(summary).toEqual({
        totalOrdersGenerated: 3,
        industriesProcessed: 2,
        ordersByIndustry: {
          'industry1': 2,
          'industry2': 1
        },
        ordersByAarType: {
          'boxcar': 2,
          'flatcar': 1
        }
      });
    });

    it('should handle empty orders', () => {
      const summary = createOrderGenerationSummary([], []);
      
      expect(summary.totalOrdersGenerated).toBe(0);
      expect(summary.industriesProcessed).toBe(0);
      expect(summary.ordersByIndustry).toEqual({});
      expect(summary.ordersByAarType).toEqual({});
    });
  });

  describe('Car Assignment Validation', () => {
    const mockOrder = {
      industryId: 'industry1',
      aarTypeId: 'boxcar',
      status: 'pending'
    };

    const mockCar = {
      _id: 'car1',
      carType: 'boxcar',
      isInService: true
    };

    it('should validate successful car assignment', () => {
      const result = validateCarAssignment(mockOrder, mockCar);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject assignment to non-existent car', () => {
      const result = validateCarAssignment(mockOrder, null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Car not found');
    });

    it('should reject assignment to out-of-service car', () => {
      const outOfServiceCar = { ...mockCar, isInService: false };
      const result = validateCarAssignment(mockOrder, outOfServiceCar);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Car is not in service');
    });

    it('should reject car type mismatch', () => {
      const wrongTypeCar = { ...mockCar, carType: 'flatcar' };
      const result = validateCarAssignment(mockOrder, wrongTypeCar);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Car type mismatch: order accepts boxcar, car is flatcar');
    });

    it('should reject assignment to non-pending order', () => {
      const assignedOrder = { ...mockOrder, status: 'assigned' };
      const result = validateCarAssignment(assignedOrder, mockCar);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot assign car to order with status: assigned');
    });

    it('should accumulate multiple errors', () => {
      const badOrder = { ...mockOrder, status: 'delivered' };
      const badCar = { ...mockCar, carType: 'flatcar', isInService: false };
      const result = validateCarAssignment(badOrder, badCar);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Duplicate Order Detection', () => {
    const existingOrders = [
      {
        industryId: 'industry1',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'pending'
      },
      {
        industryId: 'industry1',
        aarTypeId: 'flatcar',
        sessionNumber: 1,
        status: 'assigned'
      }
    ];

    it('should detect duplicate pending order', () => {
      const newOrder = {
        industryId: 'industry1',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'pending'
      };
      
      const isDuplicate = checkDuplicateOrder(existingOrders, newOrder);
      expect(isDuplicate).toBe(true);
    });

    it('should allow different AAR type', () => {
      const newOrder = {
        industryId: 'industry1',
        aarTypeId: 'hopper',
        sessionNumber: 1,
        status: 'pending'
      };
      
      const isDuplicate = checkDuplicateOrder(existingOrders, newOrder);
      expect(isDuplicate).toBe(false);
    });

    it('should allow different session', () => {
      const newOrder = {
        industryId: 'industry1',
        aarTypeId: 'boxcar',
        sessionNumber: 2,
        status: 'pending'
      };
      
      const isDuplicate = checkDuplicateOrder(existingOrders, newOrder);
      expect(isDuplicate).toBe(false);
    });

    it('should allow different industry', () => {
      const newOrder = {
        industryId: 'industry2',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'pending'
      };
      
      const isDuplicate = checkDuplicateOrder(existingOrders, newOrder);
      expect(isDuplicate).toBe(false);
    });

    it('should ignore non-pending orders', () => {
      const newOrder = {
        industryId: 'industry1',
        aarTypeId: 'flatcar', // This exists but is 'assigned', not 'pending'
        sessionNumber: 1,
        status: 'pending'
      };
      
      const isDuplicate = checkDuplicateOrder(existingOrders, newOrder);
      expect(isDuplicate).toBe(false);
    });
  });

  describe('Status Transition Validation', () => {
    it('should allow valid transitions from pending', () => {
      const validTransitions = ['assigned', 'delivered'];
      
      validTransitions.forEach(newStatus => {
        const result = validateStatusTransition('pending', newStatus);
        expect(result.valid).toBe(true);
      });
    });

    it('should allow valid transitions from assigned', () => {
      const validTransitions = ['in-transit', 'delivered', 'pending'];
      
      validTransitions.forEach(newStatus => {
        const result = validateStatusTransition('assigned', newStatus);
        expect(result.valid).toBe(true);
      });
    });

    it('should allow valid transitions from in-transit', () => {
      const validTransitions = ['delivered', 'assigned'];
      
      validTransitions.forEach(newStatus => {
        const result = validateStatusTransition('in-transit', newStatus);
        expect(result.valid).toBe(true);
      });
    });

    it('should not allow transitions from delivered', () => {
      const invalidTransitions = ['pending', 'assigned', 'in-transit'];
      
      invalidTransitions.forEach(newStatus => {
        const result = validateStatusTransition('delivered', newStatus);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject invalid transitions', () => {
      const result = validateStatusTransition('pending', 'in-transit');
      expect(result.valid).toBe(false);
      expect(result.allowedTransitions).toEqual(['assigned', 'delivered']);
    });

    it('should handle unknown current status', () => {
      const result = validateStatusTransition('unknown-status', 'pending');
      expect(result.valid).toBe(false);
      expect(result.allowedTransitions).toEqual([]);
    });

    it('should return allowed transitions', () => {
      const result = validateStatusTransition('assigned', 'invalid');
      expect(result.valid).toBe(false);
      expect(result.allowedTransitions).toEqual(['in-transit', 'delivered', 'pending']);
    });
  });
});
