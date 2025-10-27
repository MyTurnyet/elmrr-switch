/**
 * Null Object Pattern Tests
 * Tests for null object implementations and helper utilities
 */

import { isNullObject, isPresent } from '../patterns/NullObject.js';
import { NULL_CAR } from '../patterns/nullObjects/NullCar.js';
import { NULL_TRAIN } from '../patterns/nullObjects/NullTrain.js';
import { NULL_INDUSTRY } from '../patterns/nullObjects/NullIndustry.js';
import { NULL_ROUTE } from '../patterns/nullObjects/NullRoute.js';
import { NULL_CAR_ORDER } from '../patterns/nullObjects/NullCarOrder.js';
import { NULL_OPERATING_SESSION } from '../patterns/nullObjects/NullOperatingSession.js';
import { NULL_LOCOMOTIVE } from '../patterns/nullObjects/NullLocomotive.js';
import { NULL_STATION } from '../patterns/nullObjects/NullStation.js';
import { NULL_AAR_TYPE } from '../patterns/nullObjects/NullAarType.js';
import { throwIfNull, getOrDefault, filterNullObjects, allPresent, anyNull } from '../utils/nullObjectHelpers.js';
import { ApiError } from '../middleware/errorHandler.js';

describe('Null Object Pattern', () => {
  describe('isNullObject', () => {
    it('should identify null objects', () => {
      expect(isNullObject(NULL_CAR)).toBe(true);
      expect(isNullObject(NULL_TRAIN)).toBe(true);
      expect(isNullObject(NULL_INDUSTRY)).toBe(true);
      expect(isNullObject(NULL_ROUTE)).toBe(true);
      expect(isNullObject(NULL_CAR_ORDER)).toBe(true);
      expect(isNullObject(NULL_OPERATING_SESSION)).toBe(true);
      expect(isNullObject(NULL_LOCOMOTIVE)).toBe(true);
      expect(isNullObject(NULL_STATION)).toBe(true);
      expect(isNullObject(NULL_AAR_TYPE)).toBe(true);
    });

    it('should not identify regular objects as null objects', () => {
      expect(isNullObject({ id: '123', name: 'Test' })).toBe(false);
      expect(isNullObject(null)).toBe(false);
      expect(isNullObject(undefined)).toBe(false);
      expect(isNullObject('')).toBe(false);
    });
  });

  describe('isPresent', () => {
    it('should return false for null objects', () => {
      expect(isPresent(NULL_CAR)).toBe(false);
      expect(isPresent(NULL_TRAIN)).toBe(false);
    });

    it('should return true for regular objects', () => {
      expect(isPresent({ id: '123', name: 'Test' })).toBe(true);
    });
  });

  describe('NullCar', () => {
    it('should have safe default values', () => {
      expect(NULL_CAR.reportingMarks).toBe('UNKNOWN');
      expect(NULL_CAR.reportingNumber).toBe('0000');
      expect(NULL_CAR.isInService).toBe(false);
      expect(NULL_CAR._id).toBe('');
    });

    it('should be marked as null object', () => {
      expect(NULL_CAR.isNull).toBe(true);
      expect(NULL_CAR.isValid).toBe(false);
    });

    it('should serialize to JSON', () => {
      const json = NULL_CAR.toJSON();
      expect(json.reportingMarks).toBe('UNKNOWN');
      expect(json.isNull).toBe(true);
    });

    it('should have toString method', () => {
      expect(NULL_CAR.toString()).toBe('NullCar');
    });
  });

  describe('NullTrain', () => {
    it('should have safe default values', () => {
      expect(NULL_TRAIN.name).toBe('Unknown Train');
      expect(NULL_TRAIN.status).toBe('Planned');
      expect(NULL_TRAIN.maxCapacity).toBe(0);
      expect(NULL_TRAIN.locomotiveIds).toEqual([]);
    });

    it('should be marked as null object', () => {
      expect(NULL_TRAIN.isNull).toBe(true);
      expect(NULL_TRAIN.isValid).toBe(false);
    });
  });

  describe('NullIndustry', () => {
    it('should have safe default values', () => {
      expect(NULL_INDUSTRY.name).toBe('Unknown Industry');
      expect(NULL_INDUSTRY.isYard).toBe(false);
      expect(NULL_INDUSTRY.goodsReceived).toEqual([]);
      expect(NULL_INDUSTRY.carDemandConfig).toEqual([]);
    });
  });

  describe('throwIfNull', () => {
    it('should throw error for null objects', () => {
      expect(() => throwIfNull(NULL_CAR, 'Car not found', 404))
        .toThrow(ApiError);
    });

    it('should not throw for regular objects', () => {
      const obj = { id: '123', name: 'Test' };
      expect(() => throwIfNull(obj, 'Not found', 404)).not.toThrow();
    });

    it('should throw with correct status code', () => {
      try {
        throwIfNull(NULL_CAR, 'Car not found', 404);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Car not found');
      }
    });
  });

  describe('getOrDefault', () => {
    it('should return default value for null objects', () => {
      const defaultCar = { reportingMarks: 'DEFAULT', reportingNumber: '9999' };
      const result = getOrDefault(NULL_CAR, defaultCar);
      expect(result).toBe(defaultCar);
    });

    it('should return original object if not null', () => {
      const car = { reportingMarks: 'REAL', reportingNumber: '1234' };
      const defaultCar = { reportingMarks: 'DEFAULT', reportingNumber: '9999' };
      const result = getOrDefault(car, defaultCar);
      expect(result).toBe(car);
    });
  });

  describe('filterNullObjects', () => {
    it('should filter out null objects from array', () => {
      const array = [
        { id: '1', name: 'Real' },
        NULL_CAR,
        { id: '2', name: 'Also Real' },
        NULL_TRAIN
      ];
      const filtered = filterNullObjects(array);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Real');
      expect(filtered[1].name).toBe('Also Real');
    });
  });

  describe('allPresent', () => {
    it('should return true if all objects are present', () => {
      const array = [
        { id: '1', name: 'Real' },
        { id: '2', name: 'Also Real' }
      ];
      expect(allPresent(array)).toBe(true);
    });

    it('should return false if any object is null', () => {
      const array = [
        { id: '1', name: 'Real' },
        NULL_CAR
      ];
      expect(allPresent(array)).toBe(false);
    });
  });

  describe('anyNull', () => {
    it('should return true if any object is null', () => {
      const array = [
        { id: '1', name: 'Real' },
        NULL_CAR
      ];
      expect(anyNull(array)).toBe(true);
    });

    it('should return false if all objects are present', () => {
      const array = [
        { id: '1', name: 'Real' },
        { id: '2', name: 'Also Real' }
      ];
      expect(anyNull(array)).toBe(false);
    });
  });
});
