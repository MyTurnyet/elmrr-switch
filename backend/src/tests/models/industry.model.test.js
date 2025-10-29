import { 
  validateIndustry, 
  validateCarDemandConfig,
  calculateTotalDemand,
  getActiveDemandForSession,
  formatDemandConfig,
  getInboundDemand,
  getOutboundDemand,
  getIndustryGoods,
  getCompatibleCarTypesForGood
} from '../../models/industry.js';

describe('Industry Model Validation', () => {
  const validIndustry = {
    name: 'Test Industry',
    stationId: 'station1',
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
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN', 'FC'], carsPerSession: 2, frequency: 1 },
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 2 }
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

    it('should require goodsId in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('goodsId');
    });

    it('should require direction in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('direction');
    });

    it('should validate direction enum values', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'invalid', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('inbound');
    });

    it('should require compatibleCarTypes in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('compatibleCarTypes');
    });

    it('should require at least one compatible car type', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: [], carsPerSession: 2, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1');
    });

    it('should require carsPerSession in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('carsPerSession');
    });

    it('should require frequency in demand config', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('frequency');
    });

    it('should enforce minimum carsPerSession of 1', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 0, frequency: 1 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce minimum frequency of 1', () => {
      const industry = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 1, frequency: 0 }]
      };
      const { error } = validateIndustry(industry);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce integer values for carsPerSession and frequency', () => {
      const industry1 = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 1.5, frequency: 1 }]
      };
      const { error: error1 } = validateIndustry(industry1);
      expect(error1).toBeDefined();
      expect(error1.details[0].message).toContain('integer');

      const industry2 = {
        ...validIndustry,
        carDemandConfig: [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 1, frequency: 2.5 }]
      };
      const { error: error2 } = validateIndustry(industry2);
      expect(error2).toBeDefined();
      expect(error2.details[0].message).toContain('integer');
    });
  });

  describe('Car Demand Config Validation Helper', () => {
    it('should validate correct demand configuration', () => {
      const config = [
        { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN', 'FC'], carsPerSession: 2, frequency: 1 },
        { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 2 }
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect duplicate goods + direction combinations', () => {
      const config = [
        { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 },
        { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['FC'], carsPerSession: 1, frequency: 2 }
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Duplicate combination of goods 'logs' with direction 'inbound'");
    });

    it('should allow same goods with different directions', () => {
      const config = [
        { goodsId: 'coal', direction: 'inbound', compatibleCarTypes: ['HM'], carsPerSession: 2, frequency: 1 },
        { goodsId: 'coal', direction: 'outbound', compatibleCarTypes: ['HM'], carsPerSession: 1, frequency: 2 }
      ];
      const result = validateCarDemandConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = validateCarDemandConfig('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('carDemandConfig must be an array');
    });

    it('should validate individual config items', () => {
      const config = [
        { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 0, frequency: 1 }, // Invalid: carsPerSession < 1
        { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], frequency: 2 } // Invalid: missing carsPerSession
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
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 }, // Every session
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 3, frequency: 2 },  // Every 2nd session
      { goodsId: 'coal', direction: 'inbound', compatibleCarTypes: ['HM'], carsPerSession: 1, frequency: 3 }   // Every 3rd session
    ];

    it('should calculate total demand for session 1', () => {
      const total = calculateTotalDemand(demandConfig, 1);
      expect(total).toBe(2); // Only logs (1 % 1 === 0)
    });

    it('should calculate total demand for session 2', () => {
      const total = calculateTotalDemand(demandConfig, 2);
      expect(total).toBe(5); // logs (2) + lumber (3)
    });

    it('should calculate total demand for session 3', () => {
      const total = calculateTotalDemand(demandConfig, 3);
      expect(total).toBe(3); // logs (2) + coal (1)
    });

    it('should calculate total demand for session 6', () => {
      const total = calculateTotalDemand(demandConfig, 6);
      expect(total).toBe(6); // All: logs (2) + lumber (3) + coal (1)
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
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 },
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 3, frequency: 2 },
      { goodsId: 'coal', direction: 'inbound', compatibleCarTypes: ['HM'], carsPerSession: 1, frequency: 3 }
    ];

    it('should return active demand for session 1', () => {
      const active = getActiveDemandForSession(demandConfig, 1);
      expect(active).toHaveLength(1);
      expect(active[0].goodsId).toBe('logs');
    });

    it('should return active demand for session 2', () => {
      const active = getActiveDemandForSession(demandConfig, 2);
      expect(active).toHaveLength(2);
      expect(active.map(d => d.goodsId)).toContain('logs');
      expect(active.map(d => d.goodsId)).toContain('lumber');
    });

    it('should return active demand for session 6', () => {
      const active = getActiveDemandForSession(demandConfig, 6);
      expect(active).toHaveLength(3);
      expect(active.map(d => d.goodsId)).toEqual(['logs', 'lumber', 'coal']);
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
      const config = [{ goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN', 'FC'], carsPerSession: 2, frequency: 1 }];
      const formatted = formatDemandConfig(config);
      expect(formatted).toBe('inbound: 2 car(s) of logs (GN/FC) every 1 session(s)');
    });

    it('should format multiple demand configs', () => {
      const config = [
        { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 },
        { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 3 }
      ];
      const formatted = formatDemandConfig(config);
      expect(formatted).toBe('inbound: 2 car(s) of logs (GN) every 1 session(s), outbound: 1 car(s) of lumber (XM) every 3 session(s)');
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

  describe('Get Inbound/Outbound Demand', () => {
    const demandConfig = [
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 },
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 2 },
      { goodsId: 'coal', direction: 'inbound', compatibleCarTypes: ['HM'], carsPerSession: 3, frequency: 1 }
    ];

    it('should return only inbound demand', () => {
      const inbound = getInboundDemand(demandConfig);
      expect(inbound).toHaveLength(2);
      expect(inbound.map(d => d.goodsId)).toEqual(['logs', 'coal']);
    });

    it('should return only outbound demand', () => {
      const outbound = getOutboundDemand(demandConfig);
      expect(outbound).toHaveLength(1);
      expect(outbound[0].goodsId).toBe('lumber');
    });

    it('should handle empty config', () => {
      expect(getInboundDemand([])).toEqual([]);
      expect(getOutboundDemand([])).toEqual([]);
    });

    it('should handle null config', () => {
      expect(getInboundDemand(null)).toEqual([]);
      expect(getOutboundDemand(null)).toEqual([]);
    });
  });

  describe('Get Industry Goods', () => {
    const demandConfig = [
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN'], carsPerSession: 2, frequency: 1 },
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 2 },
      { goodsId: 'coal', direction: 'inbound', compatibleCarTypes: ['HM'], carsPerSession: 3, frequency: 1 },
      { goodsId: 'lumber', direction: 'inbound', compatibleCarTypes: ['XM'], carsPerSession: 1, frequency: 1 }
    ];

    it('should return unique goods by direction', () => {
      const goods = getIndustryGoods(demandConfig);
      expect(goods.inbound).toEqual(['logs', 'coal', 'lumber']);
      expect(goods.outbound).toEqual(['lumber']);
    });

    it('should handle empty config', () => {
      const goods = getIndustryGoods([]);
      expect(goods.inbound).toEqual([]);
      expect(goods.outbound).toEqual([]);
    });

    it('should handle null config', () => {
      const goods = getIndustryGoods(null);
      expect(goods.inbound).toEqual([]);
      expect(goods.outbound).toEqual([]);
    });
  });

  describe('Get Compatible Car Types for Good', () => {
    const demandConfig = [
      { goodsId: 'logs', direction: 'inbound', compatibleCarTypes: ['GN', 'FC'], carsPerSession: 2, frequency: 1 },
      { goodsId: 'lumber', direction: 'outbound', compatibleCarTypes: ['XM', 'FCB'], carsPerSession: 1, frequency: 2 }
    ];

    it('should return compatible car types for specific good and direction', () => {
      const types = getCompatibleCarTypesForGood(demandConfig, 'logs', 'inbound');
      expect(types).toEqual(['GN', 'FC']);
    });

    it('should return different types for different directions', () => {
      const types = getCompatibleCarTypesForGood(demandConfig, 'lumber', 'outbound');
      expect(types).toEqual(['XM', 'FCB']);
    });

    it('should return empty array for non-existent good', () => {
      const types = getCompatibleCarTypesForGood(demandConfig, 'coal', 'inbound');
      expect(types).toEqual([]);
    });

    it('should return empty array for wrong direction', () => {
      const types = getCompatibleCarTypesForGood(demandConfig, 'logs', 'outbound');
      expect(types).toEqual([]);
    });

    it('should handle empty config', () => {
      const types = getCompatibleCarTypesForGood([], 'logs', 'inbound');
      expect(types).toEqual([]);
    });

    it('should handle null config', () => {
      const types = getCompatibleCarTypesForGood(null, 'logs', 'inbound');
      expect(types).toEqual([]);
    });
  });
});
