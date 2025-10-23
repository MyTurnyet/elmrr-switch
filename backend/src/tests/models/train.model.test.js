import { 
  validateTrain,
  validateTrainNameUniqueness,
  validateLocomotiveAssignments,
  validateStatusTransition,
  calculateCapacityUsage,
  formatTrainSummary,
  validateSwitchListRequirements
} from '../../models/train.js';

describe('Train Model Validation', () => {
  const validTrain = {
    name: 'Test Local 123',
    routeId: 'route1',
    sessionNumber: 1,
    status: 'Planned',
    locomotiveIds: ['loco1'],
    maxCapacity: 20,
    assignedCarIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const validSwitchList = {
    stations: [
      {
        stationId: 'station1',
        stationName: 'Test Station',
        pickups: [
          {
            carId: 'car1',
            carReportingMarks: 'UP',
            carNumber: '12345',
            carType: 'boxcar',
            destinationIndustryId: 'industry1',
            destinationIndustryName: 'Test Industry',
            carOrderId: 'order1'
          }
        ],
        setouts: []
      }
    ],
    totalPickups: 1,
    totalSetouts: 0,
    finalCarCount: 1,
    generatedAt: new Date().toISOString()
  };

  describe('Validation - Required Fields', () => {
    it('should validate a complete train object', () => {
      const { error } = validateTrain(validTrain);
      expect(error).toBeUndefined();
    });

    it('should require name', () => {
      const { error } = validateTrain({ ...validTrain, name: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should require routeId', () => {
      const { error } = validateTrain({ ...validTrain, routeId: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('routeId');
    });

    it('should require sessionNumber', () => {
      const { error } = validateTrain({ ...validTrain, sessionNumber: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sessionNumber');
    });

    it('should require locomotiveIds', () => {
      const { error } = validateTrain({ ...validTrain, locomotiveIds: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('locomotiveIds');
    });

    it('should require maxCapacity', () => {
      const { error } = validateTrain({ ...validTrain, maxCapacity: undefined });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('maxCapacity');
    });
  });

  describe('Validation - Default Values', () => {
    it('should default status to Planned', () => {
      const train = { ...validTrain };
      delete train.status;
      const { error, value } = validateTrain(train);
      expect(error).toBeUndefined();
      expect(value.status).toBe('Planned');
    });

    it('should default assignedCarIds to empty array', () => {
      const train = { ...validTrain };
      delete train.assignedCarIds;
      const { error, value } = validateTrain(train);
      expect(error).toBeUndefined();
      expect(value.assignedCarIds).toEqual([]);
    });

    it('should auto-set createdAt if not provided', () => {
      const train = { ...validTrain };
      delete train.createdAt;
      const { error, value } = validateTrain(train);
      expect(error).toBeUndefined();
      expect(value.createdAt).toBeDefined();
      expect(new Date(value.createdAt)).toBeInstanceOf(Date);
    });

    it('should auto-set updatedAt if not provided', () => {
      const train = { ...validTrain };
      delete train.updatedAt;
      const { error, value } = validateTrain(train);
      expect(error).toBeUndefined();
      expect(value.updatedAt).toBeDefined();
      expect(new Date(value.updatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Validation - Field Constraints', () => {
    it('should enforce max length for name', () => {
      const { error } = validateTrain({
        ...validTrain,
        name: 'A'.repeat(101) // 101 chars > max 100
      });
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should validate status enum values', () => {
      const { error } = validateTrain({
        ...validTrain,
        status: 'Invalid Status'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Planned');
    });

    it('should allow valid status values', () => {
      const validStatuses = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
      
      validStatuses.forEach(status => {
        const { error } = validateTrain({
          ...validTrain,
          status
        });
        expect(error).toBeUndefined();
      });
    });

    it('should enforce minimum sessionNumber of 1', () => {
      const { error } = validateTrain({
        ...validTrain,
        sessionNumber: 0
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('greater than or equal to 1');
    });

    it('should enforce integer sessionNumber', () => {
      const { error } = validateTrain({
        ...validTrain,
        sessionNumber: 1.5
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('integer');
    });

    it('should require at least one locomotive', () => {
      const { error } = validateTrain({
        ...validTrain,
        locomotiveIds: []
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1 items');
    });

    it('should enforce maxCapacity constraints', () => {
      const { error: minError } = validateTrain({
        ...validTrain,
        maxCapacity: 0
      });
      expect(minError).toBeDefined();
      expect(minError.details[0].message).toContain('greater than or equal to 1');

      const { error: maxError } = validateTrain({
        ...validTrain,
        maxCapacity: 101
      });
      expect(maxError).toBeDefined();
      expect(maxError.details[0].message).toContain('less than or equal to 100');
    });

    it('should enforce integer maxCapacity', () => {
      const { error } = validateTrain({
        ...validTrain,
        maxCapacity: 20.5
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('integer');
    });
  });

  describe('Validation - Update Mode', () => {
    it('should allow partial updates with all fields optional', () => {
      const { error } = validateTrain({
        name: 'Updated Name',
        maxCapacity: 25
      }, true);
      expect(error).toBeUndefined();
    });

    it('should still enforce constraints in update mode', () => {
      const { error } = validateTrain({
        maxCapacity: 0
      }, true);
      expect(error).toBeDefined();
    });
  });

  describe('Validation - Switch List Schema', () => {
    it('should validate complete switch list', () => {
      const train = {
        ...validTrain,
        switchList: validSwitchList
      };
      const { error } = validateTrain(train);
      expect(error).toBeUndefined();
    });

    it('should allow null switch list', () => {
      const train = {
        ...validTrain,
        switchList: null
      };
      const { error } = validateTrain(train);
      expect(error).toBeUndefined();
    });

    it('should validate switch list item structure', () => {
      const invalidSwitchList = {
        ...validSwitchList,
        stations: [{
          ...validSwitchList.stations[0],
          pickups: [{
            carId: 'car1',
            // Missing required fields
          }]
        }]
      };

      const train = {
        ...validTrain,
        switchList: invalidSwitchList
      };
      const { error } = validateTrain(train);
      expect(error).toBeDefined();
    });
  });

  describe('Train Name Uniqueness Validation', () => {
    const existingTrains = [
      { _id: 'train1', name: 'Local 123', sessionNumber: 1 },
      { _id: 'train2', name: 'Express 456', sessionNumber: 1 },
      { _id: 'train3', name: 'Local 123', sessionNumber: 2 }
    ];

    it('should detect duplicate name in same session', () => {
      const result = validateTrainNameUniqueness(existingTrains, 'Local 123', 1);
      expect(result.valid).toBe(false);
      expect(result.duplicateTrains).toHaveLength(1);
    });

    it('should allow same name in different session', () => {
      const result = validateTrainNameUniqueness(existingTrains, 'Local 123', 3);
      expect(result.valid).toBe(true);
      expect(result.duplicateTrains).toHaveLength(0);
    });

    it('should allow unique name in same session', () => {
      const result = validateTrainNameUniqueness(existingTrains, 'Freight 789', 1);
      expect(result.valid).toBe(true);
      expect(result.duplicateTrains).toHaveLength(0);
    });

    it('should exclude specific train ID from check', () => {
      const result = validateTrainNameUniqueness(existingTrains, 'Local 123', 1, 'train1');
      expect(result.valid).toBe(true);
      expect(result.duplicateTrains).toHaveLength(0);
    });
  });

  describe('Locomotive Assignment Validation', () => {
    const existingTrains = [
      { _id: 'train1', status: 'Planned', locomotiveIds: ['loco1', 'loco2'] },
      { _id: 'train2', status: 'In Progress', locomotiveIds: ['loco3'] },
      { _id: 'train3', status: 'Completed', locomotiveIds: ['loco4'] },
      { _id: 'train4', status: 'Cancelled', locomotiveIds: ['loco5'] }
    ];

    it('should detect conflicts with active trains', () => {
      const result = validateLocomotiveAssignments(existingTrains, ['loco1', 'loco6']);
      expect(result.valid).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].locomotiveId).toBe('loco1');
    });

    it('should allow locomotives from completed/cancelled trains', () => {
      const result = validateLocomotiveAssignments(existingTrains, ['loco4', 'loco5']);
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should allow unique locomotives', () => {
      const result = validateLocomotiveAssignments(existingTrains, ['loco6', 'loco7']);
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should exclude specific train ID from check', () => {
      const result = validateLocomotiveAssignments(existingTrains, ['loco1'], 'train1');
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect multiple conflicts', () => {
      const result = validateLocomotiveAssignments(existingTrains, ['loco1', 'loco3']);
      expect(result.valid).toBe(false);
      expect(result.conflicts).toHaveLength(2);
    });
  });

  describe('Status Transition Validation', () => {
    it('should allow valid transitions from Planned', () => {
      const validTransitions = ['In Progress', 'Cancelled'];
      
      validTransitions.forEach(newStatus => {
        const result = validateStatusTransition('Planned', newStatus);
        expect(result.valid).toBe(true);
      });
    });

    it('should allow valid transitions from In Progress', () => {
      const validTransitions = ['Completed', 'Cancelled'];
      
      validTransitions.forEach(newStatus => {
        const result = validateStatusTransition('In Progress', newStatus);
        expect(result.valid).toBe(true);
      });
    });

    it('should not allow transitions from final states', () => {
      const finalStates = ['Completed', 'Cancelled'];
      
      finalStates.forEach(currentStatus => {
        const result = validateStatusTransition(currentStatus, 'Planned');
        expect(result.valid).toBe(false);
        expect(result.allowedTransitions).toEqual([]);
      });
    });

    it('should reject invalid transitions', () => {
      const result = validateStatusTransition('Planned', 'Completed');
      expect(result.valid).toBe(false);
      expect(result.allowedTransitions).toEqual(['In Progress', 'Cancelled']);
    });

    it('should handle unknown current status', () => {
      const result = validateStatusTransition('Unknown', 'Planned');
      expect(result.valid).toBe(false);
      expect(result.allowedTransitions).toEqual([]);
    });
  });

  describe('Capacity Usage Calculation', () => {
    it('should calculate capacity for switch list with pickups and setouts', () => {
      const switchList = {
        stations: [
          {
            pickups: [{ carId: 'car1' }, { carId: 'car2' }],
            setouts: []
          },
          {
            pickups: [{ carId: 'car3' }],
            setouts: [{ carId: 'car1' }]
          },
          {
            pickups: [],
            setouts: [{ carId: 'car2' }, { carId: 'car3' }]
          }
        ]
      };

      const usage = calculateCapacityUsage(switchList);
      expect(usage.maxLoad).toBe(2); // Max at station 1: 2 pickups, then 2+1-1=2 at station 2
      expect(usage.finalLoad).toBe(0); // All cars delivered
    });

    it('should handle empty switch list', () => {
      const usage = calculateCapacityUsage(null);
      expect(usage.currentLoad).toBe(0);
      expect(usage.maxLoad).toBe(0);
      expect(usage.finalLoad).toBe(0);
    });

    it('should handle switch list with no stations', () => {
      const switchList = { stations: [] };
      const usage = calculateCapacityUsage(switchList);
      expect(usage.maxLoad).toBe(0);
      expect(usage.finalLoad).toBe(0);
    });
  });

  describe('Train Summary Formatting', () => {
    it('should format basic train summary', () => {
      const train = {
        _id: 'train1',
        name: 'Local 123',
        status: 'Planned',
        sessionNumber: 1,
        locomotiveIds: ['loco1', 'loco2'],
        maxCapacity: 20,
        assignedCarIds: ['car1', 'car2']
      };

      const summary = formatTrainSummary(train);
      expect(summary).toEqual({
        id: 'train1',
        name: 'Local 123',
        status: 'Planned',
        sessionNumber: 1,
        locomotiveCount: 2,
        maxCapacity: 20,
        assignedCars: 2
      });
    });

    it('should include switch list summary when present', () => {
      const train = {
        _id: 'train1',
        name: 'Local 123',
        status: 'In Progress',
        sessionNumber: 1,
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: ['car1'],
        switchList: {
          stations: [{ pickups: [], setouts: [] }, { pickups: [], setouts: [] }],
          totalPickups: 5,
          totalSetouts: 3,
          finalCarCount: 2
        }
      };

      const summary = formatTrainSummary(train);
      expect(summary.switchList).toEqual({
        totalStations: 2,
        totalPickups: 5,
        totalSetouts: 3,
        maxLoad: 0,
        finalCarCount: 2
      });
    });
  });

  describe('Switch List Requirements Validation', () => {
    const mockRoute = { _id: 'route1', name: 'Test Route' };
    const mockLocomotives = [
      { _id: 'loco1', reportingMarks: 'UP 1234', isInService: true }
    ];

    it('should validate successful requirements', () => {
      const train = { ...validTrain, status: 'Planned' };
      const result = validateSwitchListRequirements(train, mockRoute, mockLocomotives);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject non-Planned trains', () => {
      const train = { ...validTrain, status: 'In Progress' };
      const result = validateSwitchListRequirements(train, mockRoute, mockLocomotives);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot generate switch list for train with status: In Progress');
    });

    it('should reject missing route', () => {
      const train = { ...validTrain, status: 'Planned' };
      const result = validateSwitchListRequirements(train, null, mockLocomotives);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Route not found');
    });

    it('should reject missing locomotives', () => {
      const train = { ...validTrain, status: 'Planned' };
      const result = validateSwitchListRequirements(train, mockRoute, []);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No locomotives found for this train');
    });

    it('should reject inactive locomotives', () => {
      const inactiveLocos = [
        { _id: 'loco1', reportingMarks: 'UP 1234', isInService: false }
      ];
      const train = { ...validTrain, status: 'Planned' };
      const result = validateSwitchListRequirements(train, mockRoute, inactiveLocos);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Inactive locomotives: UP 1234');
    });

    it('should accumulate multiple errors', () => {
      const train = { ...validTrain, status: 'Completed' };
      const result = validateSwitchListRequirements(train, null, []);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Validation - Custom _id Support', () => {
    it('should allow custom _id for seed data', () => {
      const { error } = validateTrain({
        ...validTrain,
        _id: 'custom-train-id'
      });
      expect(error).toBeUndefined();
    });

    it('should make _id optional', () => {
      const { error } = validateTrain(validTrain);
      expect(error).toBeUndefined();
    });
  });
});
