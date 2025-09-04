import { validateCar } from '../../models/car.js';

describe('Car Model Validation', () => {
  const validCar = {
    reportingMarks: 'ATSF',
    reportingNumber: '12345',
    carType: 'boxcar',
    color: 'brown',
    homeYard: 'yard1',
    currentIndustry: 'industry1',
    isInService: true
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete car object', () => {
      const { error } = validateCar(validCar);
      expect(error).toBeUndefined();
    });

    it('should require reportingMarks', () => {
      const { error } = validateCar({ ...validCar, reportingMarks: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingMarks');
    });

    it('should require reportingNumber', () => {
      const { error } = validateCar({ ...validCar, reportingNumber: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingNumber');
    });

    it('should require carType', () => {
      const { error } = validateCar({ ...validCar, carType: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('carType');
    });

    it('should require color', () => {
      const { error } = validateCar({ ...validCar, color: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('color');
    });

    it('should require homeYard', () => {
      const { error } = validateCar({ ...validCar, homeYard: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('homeYard');
    });

    it('should require currentIndustry', () => {
      const { error } = validateCar({ ...validCar, currentIndustry: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('currentIndustry');
    });
  });

  describe('Validation - Optional Fields', () => {
    it('should allow empty notes', () => {
      const { error } = validateCar({ ...validCar, notes: '' });
      expect(error).toBeUndefined();
    });

    it('should allow currentLoad to be empty', () => {
      const { error } = validateCar({ ...validCar, currentLoad: '' });
      expect(error).toBeUndefined();
    });

    it('should set default isInService to true', () => {
      const car = { ...validCar };
      delete car.isInService;
      const { value } = validateCar(car);
      expect(value.isInService).toBe(true);
    });

    it('should set default sessionsAtCurrentLocation to 0', () => {
      const car = { ...validCar };
      delete car.sessionsAtCurrentLocation;
      const { value } = validateCar(car);
      expect(value.sessionsAtCurrentLocation).toBe(0);
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce max length for reportingMarks', () => {
      const { error } = validateCar({ 
        ...validCar, 
        reportingMarks: 'A'.repeat(11) // 11 chars > max 10
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingMarks');
    });

    it('should enforce max length for reportingNumber', () => {
      const { error } = validateCar({ 
        ...validCar, 
        reportingNumber: '1'.repeat(11) // 11 chars > max 10
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingNumber');
    });

    it('should enforce max length for color', () => {
      const { error } = validateCar({ 
        ...validCar, 
        color: 'c'.repeat(51) // 51 chars > max 50
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('color');
    });

    it('should enforce max length for notes', () => {
      const { error } = validateCar({ 
        ...validCar, 
        notes: 'n'.repeat(501) // 501 chars > max 500
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('notes');
    });
  });

  describe('Update Validation', () => {
    it('should make all fields optional for updates', () => {
      const updateData = {
        color: 'red', // Only updating color
        notes: 'Updated notes'
      };
      const { error } = validateCar(updateData, true);
      expect(error).toBeUndefined();
    });

    it('should still validate field types for updates', () => {
      const { error } = validateCar({
        isInService: 'not-a-boolean' // Invalid type
      }, true);
      
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('isInService');
    });
  });
});
