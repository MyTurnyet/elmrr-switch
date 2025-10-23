import { 
  validateIndustry, 
  validateCarDemandConfig,
  calculateTotalDemand,
  getActiveDemandForSession,
  formatDemandConfig
} from '../../models/industry.js';

describe('Industry Model Validation', () => {
  const validIndustry = {
    name: 'Test Industry',
    stationId: 'station1',
    goodsReceived: [],
    goodsToShip: [],
    preferredCarTypes: ['boxcar', 'hopper'],
    isYard: false,
    isOnLayout: true
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete industry object', () => {
      const { error } = validateIndustry(validIndustry);
      expect(error).toBeUndefined();
    });

    it('should require name', () => {
      const { error } = validateIndustry({ ...validIndustry, name: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should require stationId', () => {
      const { error } = validateIndustry({ ...validIndustry, stationId: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('stationId');
    });
  });

  describe('Validation - Default Values', () => {
    it('should set default empty array for goodsReceived', () => {
      const industry = { ...validIndustry };
      delete industry.goodsReceived;
      const { value } = validateIndustry(industry);
      expect(value.goodsReceived).toEqual([]);
    });

    it('should set default empty array for goodsToShip', () => {
      const industry = { ...validIndustry };
      delete industry.goodsToShip;
      const { value } = validateIndustry(industry);
      expect(value.goodsToShip).toEqual([]);
    });

    it('should set default empty array for preferredCarTypes', () => {
      const industry = { ...validIndustry };
      delete industry.preferredCarTypes;
      const { value } = validateIndustry(industry);
      expect(value.preferredCarTypes).toEqual([]);
    });

    it('should set default false for isYard', () => {
      const industry = { ...validIndustry };
      delete industry.isYard;
      const { value } = validateIndustry(industry);
      expect(value.isYard).toBe(false);
    });

    it('should set default true for isOnLayout', () => {
      const industry = { ...validIndustry };
      delete industry.isOnLayout;
      const { value } = validateIndustry(industry);
      expect(value.isOnLayout).toBe(true);
    });

    it('should set default empty array for carDemandConfig', () => {
      const industry = { ...validIndustry };
      delete industry.carDemandConfig;
      const { value } = validateIndustry(industry);
      expect(value.carDemandConfig).toEqual([]);
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce max length for name', () => {
      const { error } = validateIndustry({ 
        ...validIndustry, 
        name: 'A'.repeat(101) // 101 chars > max 100
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should validate goodsReceived as string array', () => {
      const { error } = validateIndustry({
        ...validIndustry,
        goodsReceived: ['good1', 123] // Invalid: contains non-string
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('goodsReceived');
    });

    it('should validate goodsToShip as string array', () => {
      const { error } = validateIndustry({
        ...validIndustry,
        goodsToShip: ['good2', true] // Invalid: contains non-string
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('goodsToShip');
    });
  });

  describe('Update Validation', () => {
    it('should make all fields optional for updates', () => {
      const updateData = {
        name: 'Updated Name',
        isYard: true
      };
      const { error } = validateIndustry(updateData, true);
      expect(error).toBeUndefined();
    });

    it('should still validate field types for updates', () => {
      const { error } = validateIndustry({
        isYard: 'not-a-boolean' // Invalid type
      }, true);
      
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('isYard');
    });
  });

  describe('Car Demand Configuration', () => {
    const validDemandConfig = [
      { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
      { aarTypeId: 'boxcar', carsPerSession: 1, frequency: 2 }
    ];

    it('should validate industry with car demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: validDemandConfig
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeUndefined();
    });

    it('should validate empty car demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: []
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeUndefined();
    });

    it('should require aarTypeId in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('aarTypeId');
    });

    it('should require carsPerSession in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('carsPerSession');
    });

    it('should require frequency in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', carsPerSession: 2 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('frequency');
    });

    it('should enforce minimum carsPerSession of 1', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', carsPerSession: 0, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce minimum frequency of 1', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', carsPerSession: 1, frequency: 0 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce integer values for carsPerSession and frequency', () => {
      const industry1 = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', carsPerSession: 1.5, frequency: 1 }]
      };
      const { error: error1 } = validateIndustry(industry1);
      expect(error1).toBeDefined();
      expect(error1.details[0].message).toContain('integer');

      const industry2 = {
        ...validIndustry,
        carDemandConfig: [{ aarTypeId: 'flatcar', carsPerSession: 1, frequency: 2.5 }]
      };
      const { error: error2 } = validateIndustry(industry2);
      expect(error2).toBeDefined();
      expect(error2.details[0].message).toContain('integer');
    });
  });

  describe('Car Demand Config Validation Helper', () => {
    it('should validate correct demand configuration', () => {
      const config = [
        { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
        { aarTypeId: 'boxcar', carsPerSession: 1, frequency: 2 }
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect duplicate AAR types', () => {
      const config = [
        { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
        { aarTypeId: 'flatcar', carsPerSession: 1, frequency: 2 }
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Duplicate AAR type 'flatcar' in demand configuration");
    });

    it('should handle non-array input', () => {
      const result = validateCarDemandConfig('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('carDemandConfig must be an array');
    });

    it('should validate individual config items', () => {
      const config = [
        { aarTypeId: 'flatcar', carsPerSession: 0, frequency: 1 }, // Invalid: carsPerSession < 1
        { aarTypeId: 'boxcar', frequency: 2 } // Invalid: missing carsPerSession
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const result = validateCarDemandConfig([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Total Demand Calculation', () => {
    const demandConfig = [
      { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 }, // Every session
      { aarTypeId: 'boxcar', carsPerSession: 3, frequency: 2 },  // Every 2nd session
      { aarTypeId: 'hopper', carsPerSession: 1, frequency: 3 }   // Every 3rd session
    ];

    it('should calculate total demand for session 1', () => {
      const total = calculateTotalDemand(demandConfig, 1);
      expect(total).toBe(2); // Only flatcar (1 % 1 === 0)
    });

    it('should calculate total demand for session 2', () => {
      const total = calculateTotalDemand(demandConfig, 2);
      expect(total).toBe(5); // flatcar (2) + boxcar (3)
    });

    it('should calculate total demand for session 3', () => {
      const total = calculateTotalDemand(demandConfig, 3);
      expect(total).toBe(3); // flatcar (2) + hopper (1)
    });

    it('should calculate total demand for session 6', () => {
      const total = calculateTotalDemand(demandConfig, 6);
      expect(total).toBe(6); // All: flatcar (2) + boxcar (3) + hopper (1)
    });

    it('should handle empty config', () => {
      const total = calculateTotalDemand([], 1);
      expect(total).toBe(0);
    });

    it('should handle null config', () => {
      const total = calculateTotalDemand(null, 1);
      expect(total).toBe(0);
    });
  });

  describe('Active Demand for Session', () => {
    const demandConfig = [
      { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
      { aarTypeId: 'boxcar', carsPerSession: 3, frequency: 2 },
      { aarTypeId: 'hopper', carsPerSession: 1, frequency: 3 }
    ];

    it('should return active demand for session 1', () => {
      const active = getActiveDemandForSession(demandConfig, 1);
      expect(active).toHaveLength(1);
      expect(active[0].aarTypeId).toBe('flatcar');
    });

    it('should return active demand for session 2', () => {
      const active = getActiveDemandForSession(demandConfig, 2);
      expect(active).toHaveLength(2);
      expect(active.map(d => d.aarTypeId)).toContain('flatcar');
      expect(active.map(d => d.aarTypeId)).toContain('boxcar');
    });

    it('should return active demand for session 6', () => {
      const active = getActiveDemandForSession(demandConfig, 6);
      expect(active).toHaveLength(3);
      expect(active.map(d => d.aarTypeId)).toEqual(['flatcar', 'boxcar', 'hopper']);
    });

    it('should handle empty config', () => {
      const active = getActiveDemandForSession([], 1);
      expect(active).toEqual([]);
    });

    it('should handle null config', () => {
      const active = getActiveDemandForSession(null, 1);
      expect(active).toEqual([]);
    });
  });

  describe('Format Demand Config', () => {
    it('should format single demand config', () => {
      const config = [{ aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 }];
      const formatted = formatDemandConfig(config);
      expect(formatted).toBe('2 flatcar(s) every 1 session(s)');
    });

    it('should format multiple demand configs', () => {
      const config = [
        { aarTypeId: 'flatcar', carsPerSession: 2, frequency: 1 },
        { aarTypeId: 'boxcar', carsPerSession: 1, frequency: 3 }
      ];
      const formatted = formatDemandConfig(config);
      expect(formatted).toBe('2 flatcar(s) every 1 session(s), 1 boxcar(s) every 3 session(s)');
    });

    it('should handle empty config', () => {
      const formatted = formatDemandConfig([]);
      expect(formatted).toBe('No demand configured');
    });

    it('should handle null config', () => {
      const formatted = formatDemandConfig(null);
      expect(formatted).toBe('No demand configured');
    });
  });
});
