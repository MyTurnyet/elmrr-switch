import { validateRoute } from '../../models/route.js';

describe('Route Model Validation', () => {
  const validRoute = {
    name: 'Vancouver to Portland Local',
    description: 'Local freight service between Vancouver and Portland yards',
    originYard: 'vancouver-yard',
    terminationYard: 'portland-yard',
    stationSequence: ['station1', 'station2', 'station3']
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete route object', () => {
      const { error } = validateRoute(validRoute);
      expect(error).toBeUndefined();
    });

    it('should require name', () => {
      const { error } = validateRoute({ ...validRoute, name: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should require originYard', () => {
      const { error } = validateRoute({ ...validRoute, originYard: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('originYard');
    });

    it('should require terminationYard', () => {
      const { error } = validateRoute({ ...validRoute, terminationYard: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('terminationYard');
    });
  });

  describe('Validation - Optional Fields', () => {
    it('should allow empty description', () => {
      const { error } = validateRoute({ ...validRoute, description: '' });
      expect(error).toBeUndefined();
    });

    it('should allow missing description', () => {
      const route = { ...validRoute };
      delete route.description;
      const { error } = validateRoute(route);
      expect(error).toBeUndefined();
    });

    it('should allow custom _id for seed data imports', () => {
      const { error } = validateRoute({
        ...validRoute,
        _id: 'vancouver-to-portland-local'
      });
      expect(error).toBeUndefined();
    });

    it('should set default stationSequence to empty array', () => {
      const route = { ...validRoute };
      delete route.stationSequence;
      const { value } = validateRoute(route);
      expect(value.stationSequence).toEqual([]);
    });

    it('should allow empty stationSequence (direct yard-to-yard)', () => {
      const { error } = validateRoute({ ...validRoute, stationSequence: [] });
      expect(error).toBeUndefined();
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce max length for name', () => {
      const { error } = validateRoute({
        ...validRoute,
        name: 'N'.repeat(101) // 101 chars > max 100
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should enforce min length for name', () => {
      const { error } = validateRoute({
        ...validRoute,
        name: '' // Empty string < min 1
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should enforce max length for description', () => {
      const { error } = validateRoute({
        ...validRoute,
        description: 'D'.repeat(501) // 501 chars > max 500
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('description');
    });

    it('should enforce stationSequence is an array', () => {
      const { error } = validateRoute({
        ...validRoute,
        stationSequence: 'not-an-array'
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('stationSequence');
    });

    it('should enforce stationSequence contains only strings', () => {
      const { error } = validateRoute({
        ...validRoute,
        stationSequence: ['station1', 123, 'station3'] // 123 is not a string
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('stationSequence');
    });

    it('should allow stationSequence with multiple stations', () => {
      const { error } = validateRoute({
        ...validRoute,
        stationSequence: ['station1', 'station2', 'station3', 'station4', 'station5']
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Update Validation', () => {
    it('should make all fields optional for updates', () => {
      const updateData = {
        name: 'Updated Route Name',
        description: 'Updated description'
      };
      const { error } = validateRoute(updateData, true);
      expect(error).toBeUndefined();
    });

    it('should allow partial updates with only one field', () => {
      const { error } = validateRoute({
        description: 'Only updating description'
      }, true);
      expect(error).toBeUndefined();
    });

    it('should allow updating stationSequence only', () => {
      const { error } = validateRoute({
        stationSequence: ['newStation1', 'newStation2']
      }, true);
      expect(error).toBeUndefined();
    });

    it('should still validate field types for updates', () => {
      const { error } = validateRoute({
        stationSequence: 'not-an-array' // Invalid type
      }, true);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('stationSequence');
    });

    it('should still validate field constraints for updates', () => {
      const { error } = validateRoute({
        name: 'N'.repeat(101) // Still exceeds max length
      }, true);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });
  });

  describe('Edge Cases', () => {
    it('should handle route with same origin and termination yard', () => {
      const { error } = validateRoute({
        ...validRoute,
        originYard: 'same-yard',
        terminationYard: 'same-yard'
      });
      // Note: Business logic validation (same yard check) should be in route handler
      expect(error).toBeUndefined();
    });

    it('should handle route with single station in sequence', () => {
      const { error } = validateRoute({
        ...validRoute,
        stationSequence: ['single-station']
      });
      expect(error).toBeUndefined();
    });

    it('should handle very long station sequences', () => {
      const longSequence = Array.from({ length: 50 }, (_, i) => `station${i}`);
      const { error } = validateRoute({
        ...validRoute,
        stationSequence: longSequence
      });
      expect(error).toBeUndefined();
    });
  });
});
