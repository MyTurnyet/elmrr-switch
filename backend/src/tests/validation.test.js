// Test validation functions
import { validateCar } from '../models/car.js';
import { validateIndustry } from '../models/industry.js';

describe('Data Validation', () => {
  describe('Car Validation', () => {
    test('should validate complete car object', () => {
      const validCar = {
        reportingMarks: 'ATSF',
        reportingNumber: '12345',
        carType: 'boxcar',
        color: 'brown',
        homeYard: 'yard1',
        currentIndustry: 'yard1',
        isInService: true
      };

      const { error } = validateCar(validCar);
      expect(error).toBeUndefined();
    });

    test('should require reporting marks', () => {
      const invalidCar = {
        reportingNumber: '12345',
        carType: 'boxcar',
        color: 'brown',
        homeYard: 'yard1',
        currentIndustry: 'yard1',
        isInService: true
      };

      const { error } = validateCar(invalidCar);
      expect(error).toBeDefined();
    });
  });

  describe('Industry Validation', () => {
    test('should validate complete industry object', () => {
      const validIndustry = {
        name: 'Main Yard',
        stationId: 'station1',
        goodsReceived: [],
        goodsToShip: [],
        preferredCarTypes: ['all'],
        isYard: true,
        isOnLayout: true
      };

      const { error } = validateIndustry(validIndustry);
      expect(error).toBeUndefined();
    });

    test('should require name', () => {
      const invalidIndustry = {
        stationId: 'station1',
        goodsReceived: [],
        goodsToShip: [],
        preferredCarTypes: ['all'],
        isYard: true,
        isOnLayout: true
      };

      const { error } = validateIndustry(invalidIndustry);
      expect(error).toBeDefined();
    });
  });
});
