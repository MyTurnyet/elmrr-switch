import { 
  validateOperatingSession, 
  createSessionSnapshot, 
  validateSnapshot 
} from '../../models/operatingSession.js';

describe('Operating Session Model Validation', () => {
  const validSession = {
    currentSessionNumber: 1,
    sessionDate: new Date().toISOString(),
    description: 'Initial operating session',
    previousSessionSnapshot: null
  };

  const validSnapshot = {
    sessionNumber: 1,
    cars: [
      {
        id: 'car1',
        currentIndustry: 'yard1',
        sessionsAtCurrentLocation: 0
      }
    ],
    trains: [],
    carOrders: []
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete session object', () => {
      const { error } = validateOperatingSession(validSession);
      expect(error).toBeUndefined();
    });

    it('should validate currentSessionNumber when provided', () => {
      const { error } = validateOperatingSession({ 
        ...validSession, 
        currentSessionNumber: 0 // Invalid: below minimum
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should default currentSessionNumber to 1', () => {
      const { error, value } = validateOperatingSession({
        sessionDate: new Date().toISOString(),
        description: 'Test session'
      });
      expect(error).toBeUndefined();
      expect(value.currentSessionNumber).toBe(1);
    });

    it('should auto-set sessionDate if not provided', () => {
      const { error, value } = validateOperatingSession({
        currentSessionNumber: 2,
        description: 'Test session'
      });
      expect(error).toBeUndefined();
      expect(value.sessionDate).toBeDefined();
      expect(new Date(value.sessionDate)).toBeInstanceOf(Date);
    });

    it('should default description to empty string', () => {
      const { error, value } = validateOperatingSession({
        currentSessionNumber: 1
      });
      expect(error).toBeUndefined();
      expect(value.description).toBe('');
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce minimum session number of 1', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        currentSessionNumber: 0
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce session number as integer', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        currentSessionNumber: 1.5
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('integer');
    });

    it('should enforce description max length of 500 characters', () => {
      const longDescription = 'a'.repeat(501);
      const { error } = validateOperatingSession({
        ...validSession,
        description: longDescription
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('500');
    });

    it('should allow empty description', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        description: ''
      });
      expect(error).toBeUndefined();
    });

    it('should validate ISO date format for sessionDate', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        sessionDate: 'invalid-date'
      });
      expect(error).toBeDefined();
    });

    it('should allow null previousSessionSnapshot', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        previousSessionSnapshot: null
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Validation - Update Mode', () => {
    it('should allow partial updates with all fields optional', () => {
      const { error } = validateOperatingSession({
        description: 'Updated description'
      }, true);
      expect(error).toBeUndefined();
    });

    it('should still enforce constraints in update mode', () => {
      const { error } = validateOperatingSession({
        currentSessionNumber: 0
      }, true);
      expect(error).toBeDefined();
    });
  });

  describe('Validation - Custom _id Support', () => {
    it('should allow custom _id for seed data', () => {
      const { error } = validateOperatingSession({
        ...validSession,
        _id: 'custom-session-id'
      });
      expect(error).toBeUndefined();
    });

    it('should make _id optional', () => {
      const { error } = validateOperatingSession(validSession);
      expect(error).toBeUndefined();
    });
  });

  describe('Snapshot Creation', () => {
    const mockCars = [
      {
        _id: 'car1',
        currentIndustry: 'yard1',
        sessionsAtCurrentLocation: 2
      },
      {
        id: 'car2', // Test both _id and id
        currentIndustry: 'industry1',
        sessionsAtCurrentLocation: 0
      }
    ];

    const mockTrains = [
      { _id: 'train1', name: 'Local 1', status: 'Completed' }
    ];

    const mockCarOrders = [
      { _id: 'order1', industryId: 'industry1', status: 'pending' }
    ];

    it('should create valid snapshot structure', () => {
      const snapshot = createSessionSnapshot(5, mockCars, mockTrains, mockCarOrders);
      
      expect(snapshot).toEqual({
        sessionNumber: 5,
        cars: [
          {
            id: 'car1',
            currentIndustry: 'yard1',
            sessionsAtCurrentLocation: 2
          },
          {
            id: 'car2',
            currentIndustry: 'industry1',
            sessionsAtCurrentLocation: 0
          }
        ],
        trains: mockTrains,
        carOrders: mockCarOrders
      });
    });

    it('should handle missing sessionsAtCurrentLocation', () => {
      const carsWithoutSessions = [
        {
          _id: 'car1',
          currentIndustry: 'yard1'
          // sessionsAtCurrentLocation missing
        }
      ];

      const snapshot = createSessionSnapshot(1, carsWithoutSessions, [], []);
      
      expect(snapshot.cars[0].sessionsAtCurrentLocation).toBe(0);
    });

    it('should handle empty arrays', () => {
      const snapshot = createSessionSnapshot(1, [], [], []);
      
      expect(snapshot.cars).toEqual([]);
      expect(snapshot.trains).toEqual([]);
      expect(snapshot.carOrders).toEqual([]);
    });

    it('should handle null/undefined collections', () => {
      const snapshot = createSessionSnapshot(1, [], null, undefined);
      
      expect(snapshot.trains).toEqual([]);
      expect(snapshot.carOrders).toEqual([]);
    });
  });

  describe('Snapshot Validation', () => {
    it('should validate correct snapshot structure', () => {
      const { error } = validateSnapshot(validSnapshot);
      expect(error).toBeUndefined();
    });

    it('should require sessionNumber', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        sessionNumber: undefined
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sessionNumber');
    });

    it('should require cars array', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        cars: undefined
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('cars');
    });

    it('should require trains array', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        trains: undefined
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('trains');
    });

    it('should require carOrders array', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        carOrders: undefined
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('carOrders');
    });

    it('should validate car structure in snapshot', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        cars: [
          {
            // missing id
            currentIndustry: 'yard1',
            sessionsAtCurrentLocation: 0
          }
        ]
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('id');
    });

    it('should enforce minimum sessionsAtCurrentLocation', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        cars: [
          {
            id: 'car1',
            currentIndustry: 'yard1',
            sessionsAtCurrentLocation: -1
          }
        ]
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 0');
    });

    it('should allow empty arrays', () => {
      const { error } = validateSnapshot({
        sessionNumber: 1,
        cars: [],
        trains: [],
        carOrders: []
      });
      expect(error).toBeUndefined();
    });

    it('should allow unknown properties in trains and carOrders', () => {
      const { error } = validateSnapshot({
        ...validSnapshot,
        trains: [{ _id: 'train1', customField: 'value' }],
        carOrders: [{ _id: 'order1', anotherField: 123 }]
      });
      expect(error).toBeUndefined();
    });
  });
});
