import { 
  validateLocomotive,
  validateLocomotiveUniqueness,
  validateDccAddressUniqueness,
  formatLocomotiveSummary,
  formatDccAddress,
  getValidManufacturers
} from '../../models/locomotive.js';

describe('Locomotive Model Validation', () => {
  const validLocomotive = {
    reportingMarks: 'ELMR',
    reportingNumber: '003801',
    model: 'GP38-2',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3801,
    homeYard: 'yard-001',
    isInService: true,
    notes: 'Test locomotive'
  };

  describe('Schema Validation - Required Fields', () => {
    it('should validate a complete locomotive object', () => {
      const { error, value } = validateLocomotive(validLocomotive);
      expect(error).toBeUndefined();
      expect(value).toMatchObject(validLocomotive);
    });

    it('should require reportingMarks', () => {
      const { reportingMarks, ...incomplete } = validLocomotive;
      const { error } = validateLocomotive(incomplete);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingMarks');
    });

    it('should require reportingNumber', () => {
      const { reportingNumber, ...incomplete } = validLocomotive;
      const { error } = validateLocomotive(incomplete);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('reportingNumber');
    });

    it('should require model', () => {
      const { model, ...incomplete } = validLocomotive;
      const { error } = validateLocomotive(incomplete);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('model');
    });

    it('should require manufacturer', () => {
      const { manufacturer, ...incomplete } = validLocomotive;
      const { error } = validateLocomotive(incomplete);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('manufacturer');
    });

    it('should require homeYard', () => {
      const { homeYard, ...incomplete } = validLocomotive;
      const { error } = validateLocomotive(incomplete);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('homeYard');
    });
  });

  describe('Schema Validation - Field Constraints', () => {
    it('should enforce reportingNumber to be 1-6 digits', () => {
      const invalidEmpty = { ...validLocomotive, reportingNumber: '' };
      const { error: errorEmpty } = validateLocomotive(invalidEmpty);
      expect(errorEmpty).toBeDefined();

      const invalidLong = { ...validLocomotive, reportingNumber: '1234567' };
      const { error: errorLong } = validateLocomotive(invalidLong);
      expect(errorLong).toBeDefined();

      const invalidNonNumeric = { ...validLocomotive, reportingNumber: '12A45' };
      const { error: errorNonNumeric } = validateLocomotive(invalidNonNumeric);
      expect(errorNonNumeric).toBeDefined();
    });

    it('should accept valid 1-6 digit reportingNumbers', () => {
      const valid1 = { ...validLocomotive, reportingNumber: '1' };
      expect(validateLocomotive(valid1).error).toBeUndefined();

      const valid4 = { ...validLocomotive, reportingNumber: '4567' };
      expect(validateLocomotive(valid4).error).toBeUndefined();

      const valid6 = { ...validLocomotive, reportingNumber: '000123' };
      expect(validateLocomotive(valid6).error).toBeUndefined();
    });

    it('should enforce reportingMarks max length of 10', () => {
      const invalid = { ...validLocomotive, reportingMarks: 'TOOLONGMARK' };
      const { error } = validateLocomotive(invalid);
      expect(error).toBeDefined();
    });

    it('should enforce model max length of 50', () => {
      const invalid = { ...validLocomotive, model: 'A'.repeat(51) };
      const { error } = validateLocomotive(invalid);
      expect(error).toBeDefined();
    });

    it('should enforce notes max length of 500', () => {
      const invalid = { ...validLocomotive, notes: 'A'.repeat(501) };
      const { error } = validateLocomotive(invalid);
      expect(error).toBeDefined();
    });

    it('should allow empty notes', () => {
      const valid = { ...validLocomotive, notes: '' };
      const { error } = validateLocomotive(valid);
      expect(error).toBeUndefined();
    });
  });

  describe('Schema Validation - Manufacturer', () => {
    it('should accept valid manufacturers', () => {
      const validManufacturers = ['Atlas', 'Kato', 'Lionel', 'Bachmann', 'Athearn', 'Walthers', 'Broadway Limited', 'MTH', 'Rapido'];
      
      validManufacturers.forEach(manufacturer => {
        const loco = { ...validLocomotive, manufacturer };
        const { error } = validateLocomotive(loco);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid manufacturer', () => {
      const invalid = { ...validLocomotive, manufacturer: 'InvalidBrand' };
      const { error } = validateLocomotive(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });
  });

  describe('Schema Validation - DCC Configuration', () => {
    it('should default isDCC to true', () => {
      const { isDCC, ...withoutDCC } = validLocomotive;
      const { error, value } = validateLocomotive(withoutDCC);
      expect(error).toBeUndefined();
      expect(value.isDCC).toBe(true);
    });

    it('should use default dccAddress of 3 when not provided', () => {
      const { dccAddress, ...withoutAddress } = validLocomotive;
      const withDefault = { ...withoutAddress, dccAddress: 3 };
      const { error, value } = validateLocomotive(withDefault);
      expect(error).toBeUndefined();
      expect(value.dccAddress).toBe(3);
    });

    it('should require dccAddress when isDCC is true', () => {
      const invalid = { ...validLocomotive, isDCC: true, dccAddress: undefined };
      const { error } = validateLocomotive(invalid);
      expect(error).toBeDefined();
    });

    it('should not require dccAddress when isDCC is false', () => {
      const valid = { ...validLocomotive, isDCC: false, dccAddress: undefined };
      const { error } = validateLocomotive(valid);
      expect(error).toBeUndefined();
    });

    it('should enforce dccAddress range (1-9999)', () => {
      const tooLow = { ...validLocomotive, dccAddress: 0 };
      const { error: errorLow } = validateLocomotive(tooLow);
      expect(errorLow).toBeDefined();

      const tooHigh = { ...validLocomotive, dccAddress: 10000 };
      const { error: errorHigh } = validateLocomotive(tooHigh);
      expect(errorHigh).toBeDefined();
    });

    it('should accept valid dccAddress range', () => {
      const validAddresses = [1, 3, 99, 3801, 9999];
      
      validAddresses.forEach(dccAddress => {
        const loco = { ...validLocomotive, dccAddress };
        const { error } = validateLocomotive(loco);
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Schema Validation - Boolean Defaults', () => {
    it('should default isInService to true', () => {
      const { isInService, ...withoutService } = validLocomotive;
      const { error, value } = validateLocomotive(withoutService);
      expect(error).toBeUndefined();
      expect(value.isInService).toBe(true);
    });

    it('should accept explicit isInService values', () => {
      const inService = { ...validLocomotive, isInService: true };
      const { error: error1 } = validateLocomotive(inService);
      expect(error1).toBeUndefined();

      const outOfService = { ...validLocomotive, isInService: false };
      const { error: error2 } = validateLocomotive(outOfService);
      expect(error2).toBeUndefined();
    });
  });

  describe('Schema Validation - Custom _id', () => {
    it('should allow custom _id for seed data', () => {
      const withId = { ...validLocomotive, _id: 'loco-custom-001' };
      const { error, value } = validateLocomotive(withId);
      expect(error).toBeUndefined();
      expect(value._id).toBe('loco-custom-001');
    });

    it('should work without _id', () => {
      const { error } = validateLocomotive(validLocomotive);
      expect(error).toBeUndefined();
    });
  });

  describe('Schema Validation - Update Mode', () => {
    it('should allow partial updates', () => {
      const partial = { notes: 'Updated notes', isDCC: false };
      const { error } = validateLocomotive(partial, true);
      expect(error).toBeUndefined();
    });

    it('should validate fields in update mode', () => {
      const invalid = { reportingNumber: '12345' }; // Too short
      const { error } = validateLocomotive(invalid, true);
      expect(error).toBeDefined();
    });
  });

  describe('Helper Function - validateLocomotiveUniqueness', () => {
    const locomotives = [
      { _id: 'loco1', reportingMarks: 'ELMR', reportingNumber: '003801' },
      { _id: 'loco2', reportingMarks: 'ELMR', reportingNumber: '004001' },
      { _id: 'loco3', reportingMarks: 'UP', reportingNumber: '003801' }
    ];

    it('should detect duplicate reporting marks/number combination', () => {
      const result = validateLocomotiveUniqueness(locomotives, 'ELMR', '003801');
      expect(result.valid).toBe(false);
      expect(result.duplicateLocomotives).toHaveLength(1);
      expect(result.duplicateLocomotives[0]._id).toBe('loco1');
    });

    it('should allow unique reporting marks/number combination', () => {
      const result = validateLocomotiveUniqueness(locomotives, 'ELMR', '005001');
      expect(result.valid).toBe(true);
      expect(result.duplicateLocomotives).toHaveLength(0);
    });

    it('should exclude specified locomotive ID from check', () => {
      const result = validateLocomotiveUniqueness(locomotives, 'ELMR', '003801', 'loco1');
      expect(result.valid).toBe(true);
      expect(result.duplicateLocomotives).toHaveLength(0);
    });

    it('should handle empty locomotive array', () => {
      const result = validateLocomotiveUniqueness([], 'ELMR', '003801');
      expect(result.valid).toBe(true);
      expect(result.duplicateLocomotives).toHaveLength(0);
    });
  });

  describe('Helper Function - validateDccAddressUniqueness', () => {
    const locomotives = [
      { _id: 'loco1', isDCC: true, dccAddress: 3801 },
      { _id: 'loco2', isDCC: true, dccAddress: 4001 },
      { _id: 'loco3', isDCC: false, dccAddress: undefined }
    ];

    it('should detect duplicate DCC address', () => {
      const result = validateDccAddressUniqueness(locomotives, 3801);
      expect(result.valid).toBe(false);
      expect(result.conflictingLocomotives).toHaveLength(1);
      expect(result.conflictingLocomotives[0]._id).toBe('loco1');
    });

    it('should allow unique DCC address', () => {
      const result = validateDccAddressUniqueness(locomotives, 5001);
      expect(result.valid).toBe(true);
      expect(result.conflictingLocomotives).toHaveLength(0);
    });

    it('should exclude specified locomotive ID from check', () => {
      const result = validateDccAddressUniqueness(locomotives, 3801, 'loco1');
      expect(result.valid).toBe(true);
      expect(result.conflictingLocomotives).toHaveLength(0);
    });

    it('should handle null/undefined DCC address', () => {
      const result = validateDccAddressUniqueness(locomotives, null);
      expect(result.valid).toBe(true);
      expect(result.conflictingLocomotives).toHaveLength(0);
    });

    it('should handle empty locomotive array', () => {
      const result = validateDccAddressUniqueness([], 3801);
      expect(result.valid).toBe(true);
      expect(result.conflictingLocomotives).toHaveLength(0);
    });
  });

  describe('Helper Function - formatLocomotiveSummary', () => {
    it('should format locomotive with DCC address', () => {
      const loco = {
        _id: 'loco1',
        reportingMarks: 'ELMR',
        reportingNumber: '003801',
        model: 'GP38-2',
        manufacturer: 'Atlas',
        isDCC: true,
        dccAddress: 3801,
        isInService: true
      };

      const summary = formatLocomotiveSummary(loco);
      expect(summary.id).toBe('loco1');
      expect(summary.displayName).toBe('ELMR 003801');
      expect(summary.model).toBe('GP38-2');
      expect(summary.manufacturer).toBe('Atlas');
      expect(summary.isInService).toBe(true);
      expect(summary.dccAddress).toBe('3801');
    });

    it('should format single-digit DCC address with leading zero', () => {
      const loco = {
        _id: 'loco1',
        reportingMarks: 'ELMR',
        reportingNumber: '000003',
        model: 'SW1500',
        manufacturer: 'Bachmann',
        isDCC: true,
        dccAddress: 3,
        isInService: true
      };

      const summary = formatLocomotiveSummary(loco);
      expect(summary.dccAddress).toBe('03');
    });

    it('should not include DCC address for DC locomotives', () => {
      const loco = {
        _id: 'loco1',
        reportingMarks: 'ELMR',
        reportingNumber: '000901',
        model: 'GP9',
        manufacturer: 'Bachmann',
        isDCC: false,
        isInService: false
      };

      const summary = formatLocomotiveSummary(loco);
      expect(summary.dccAddress).toBeUndefined();
    });

    it('should handle out-of-service locomotives', () => {
      const loco = {
        _id: 'loco1',
        reportingMarks: 'ELMR',
        reportingNumber: '003801',
        model: 'GP38-2',
        manufacturer: 'Atlas',
        isDCC: true,
        dccAddress: 3801,
        isInService: false
      };

      const summary = formatLocomotiveSummary(loco);
      expect(summary.isInService).toBe(false);
    });
  });

  describe('Helper Function - formatDccAddress', () => {
    it('should format single-digit address with leading zero', () => {
      expect(formatDccAddress(3)).toBe('03');
      expect(formatDccAddress(9)).toBe('09');
    });

    it('should not modify multi-digit addresses', () => {
      expect(formatDccAddress(99)).toBe('99');
      expect(formatDccAddress(3801)).toBe('3801');
      expect(formatDccAddress(9999)).toBe('9999');
    });

    it('should handle null/undefined', () => {
      expect(formatDccAddress(null)).toBe('');
      expect(formatDccAddress(undefined)).toBe('');
    });
  });

  describe('Helper Function - getValidManufacturers', () => {
    it('should return array of valid manufacturers', () => {
      const manufacturers = getValidManufacturers();
      expect(Array.isArray(manufacturers)).toBe(true);
      expect(manufacturers.length).toBeGreaterThan(0);
      expect(manufacturers).toContain('Atlas');
      expect(manufacturers).toContain('Kato');
      expect(manufacturers).toContain('Lionel');
    });

    it('should return a copy of the array', () => {
      const manufacturers1 = getValidManufacturers();
      const manufacturers2 = getValidManufacturers();
      expect(manufacturers1).not.toBe(manufacturers2);
      expect(manufacturers1).toEqual(manufacturers2);
    });
  });
});
