import { validateIndustry } from '../../models/industry.js';

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
});
