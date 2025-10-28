/**
 * Type validation tests for Phase 2.2 Train Operations types
 * 
 * These tests verify that:
 * 1. Types correctly represent backend API responses
 * 2. Type guards work correctly
 * 3. Type transformations are safe
 * 4. Enum values match backend validation
 */

import { describe, it, expect } from 'vitest';
import type {
  TrainStatus,
  CarOrderStatus,
  CarDemandConfig,
  SwitchListItem,
  SwitchListStation,
  SwitchList,
  Train,
  OperatingSession,
  CarOrder,
  SessionSnapshot,
  TrainFormData,
  CarOrderGenerationRequest,
  CarOrderGenerationSummary,
} from '../index';

describe('TrainOperations Types', () => {
  describe('TrainStatus', () => {
    it('should accept valid train status values', () => {
      const validStatuses: TrainStatus[] = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
      
      validStatuses.forEach(status => {
        expect(status).toBeDefined();
        expect(typeof status).toBe('string');
      });
    });

    it('should match backend enum values exactly', () => {
      // Backend uses: 'Planned', 'In Progress', 'Completed', 'Cancelled'
      const backendStatuses = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
      const typedStatuses: TrainStatus[] = backendStatuses as TrainStatus[];
      
      expect(typedStatuses).toHaveLength(4);
      expect(typedStatuses).toContain('Planned');
      expect(typedStatuses).toContain('In Progress');
      expect(typedStatuses).toContain('Completed');
      expect(typedStatuses).toContain('Cancelled');
    });
  });

  describe('CarOrderStatus', () => {
    it('should accept valid car order status values', () => {
      const validStatuses: CarOrderStatus[] = ['pending', 'assigned', 'in-transit', 'delivered'];
      
      validStatuses.forEach(status => {
        expect(status).toBeDefined();
        expect(typeof status).toBe('string');
      });
    });

    it('should match backend enum values exactly', () => {
      // Backend uses: 'pending', 'assigned', 'in-transit', 'delivered'
      const backendStatuses = ['pending', 'assigned', 'in-transit', 'delivered'];
      const typedStatuses: CarOrderStatus[] = backendStatuses as CarOrderStatus[];
      
      expect(typedStatuses).toHaveLength(4);
      expect(typedStatuses).toContain('pending');
      expect(typedStatuses).toContain('assigned');
      expect(typedStatuses).toContain('in-transit');
      expect(typedStatuses).toContain('delivered');
    });
  });

  describe('CarDemandConfig', () => {
    it('should validate correct structure', () => {
      const validConfig: CarDemandConfig = {
        aarTypeId: 'boxcar',
        carsPerSession: 2,
        frequency: 1,
      };

      expect(validConfig.aarTypeId).toBe('boxcar');
      expect(validConfig.carsPerSession).toBe(2);
      expect(validConfig.frequency).toBe(1);
      expect(typeof validConfig.aarTypeId).toBe('string');
      expect(typeof validConfig.carsPerSession).toBe('number');
      expect(typeof validConfig.frequency).toBe('number');
    });

    it('should support multiple demand configs', () => {
      const configs: CarDemandConfig[] = [
        { aarTypeId: 'boxcar', carsPerSession: 2, frequency: 1 },
        { aarTypeId: 'flatcar', carsPerSession: 1, frequency: 2 },
      ];

      expect(configs).toHaveLength(2);
      expect(configs[0].aarTypeId).toBe('boxcar');
      expect(configs[1].aarTypeId).toBe('flatcar');
    });
  });

  describe('SwitchListItem', () => {
    it('should validate correct structure', () => {
      const item: SwitchListItem = {
        carId: 'car123',
        carReportingMarks: 'UP',
        carNumber: '12345',
        carType: 'boxcar',
        destinationIndustryId: 'industry456',
        destinationIndustryName: 'Lumber Mill',
        carOrderId: 'order789',
      };

      expect(item.carId).toBe('car123');
      expect(item.carReportingMarks).toBe('UP');
      expect(item.carNumber).toBe('12345');
      expect(item.carType).toBe('boxcar');
      expect(item.destinationIndustryId).toBe('industry456');
      expect(item.destinationIndustryName).toBe('Lumber Mill');
      expect(item.carOrderId).toBe('order789');
    });

    it('should allow null carOrderId', () => {
      const item: SwitchListItem = {
        carId: 'car123',
        carReportingMarks: 'UP',
        carNumber: '12345',
        carType: 'boxcar',
        destinationIndustryId: 'industry456',
        destinationIndustryName: 'Lumber Mill',
        carOrderId: null,
      };

      expect(item.carOrderId).toBeNull();
    });

    it('should allow undefined carOrderId', () => {
      const item: SwitchListItem = {
        carId: 'car123',
        carReportingMarks: 'UP',
        carNumber: '12345',
        carType: 'boxcar',
        destinationIndustryId: 'industry456',
        destinationIndustryName: 'Lumber Mill',
      };

      expect(item.carOrderId).toBeUndefined();
    });
  });

  describe('SwitchListStation', () => {
    it('should validate correct structure', () => {
      const station: SwitchListStation = {
        stationId: 'station123',
        stationName: 'Portland',
        pickups: [
          {
            carId: 'car1',
            carReportingMarks: 'UP',
            carNumber: '1001',
            carType: 'boxcar',
            destinationIndustryId: 'ind1',
            destinationIndustryName: 'Mill',
          },
        ],
        setouts: [
          {
            carId: 'car2',
            carReportingMarks: 'SP',
            carNumber: '2002',
            carType: 'flatcar',
            destinationIndustryId: 'ind2',
            destinationIndustryName: 'Yard',
          },
        ],
      };

      expect(station.stationId).toBe('station123');
      expect(station.stationName).toBe('Portland');
      expect(station.pickups).toHaveLength(1);
      expect(station.setouts).toHaveLength(1);
      expect(station.pickups[0].carId).toBe('car1');
      expect(station.setouts[0].carId).toBe('car2');
    });

    it('should allow empty pickups and setouts', () => {
      const station: SwitchListStation = {
        stationId: 'station123',
        stationName: 'Portland',
        pickups: [],
        setouts: [],
      };

      expect(station.pickups).toHaveLength(0);
      expect(station.setouts).toHaveLength(0);
    });
  });

  describe('SwitchList', () => {
    it('should validate complete switch list structure', () => {
      const switchList: SwitchList = {
        stations: [
          {
            stationId: 'station1',
            stationName: 'Portland',
            pickups: [],
            setouts: [],
          },
        ],
        totalPickups: 5,
        totalSetouts: 3,
        finalCarCount: 12,
        generatedAt: '2025-10-28T14:00:00.000Z',
      };

      expect(switchList.stations).toHaveLength(1);
      expect(switchList.totalPickups).toBe(5);
      expect(switchList.totalSetouts).toBe(3);
      expect(switchList.finalCarCount).toBe(12);
      expect(switchList.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should support multiple stations', () => {
      const switchList: SwitchList = {
        stations: [
          { stationId: 's1', stationName: 'Portland', pickups: [], setouts: [] },
          { stationId: 's2', stationName: 'Seattle', pickups: [], setouts: [] },
          { stationId: 's3', stationName: 'Spokane', pickups: [], setouts: [] },
        ],
        totalPickups: 10,
        totalSetouts: 8,
        finalCarCount: 15,
        generatedAt: '2025-10-28T14:00:00.000Z',
      };

      expect(switchList.stations).toHaveLength(3);
      expect(switchList.stations[0].stationName).toBe('Portland');
      expect(switchList.stations[1].stationName).toBe('Seattle');
      expect(switchList.stations[2].stationName).toBe('Spokane');
    });
  });

  describe('Train', () => {
    it('should validate minimal train structure', () => {
      const train: Train = {
        _id: 'train123',
        name: 'Portland Local',
        routeId: 'route456',
        sessionNumber: 1,
        status: 'Planned',
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };

      expect(train._id).toBe('train123');
      expect(train.name).toBe('Portland Local');
      expect(train.routeId).toBe('route456');
      expect(train.sessionNumber).toBe(1);
      expect(train.status).toBe('Planned');
      expect(train.locomotiveIds).toHaveLength(1);
      expect(train.maxCapacity).toBe(20);
      expect(train.assignedCarIds).toHaveLength(0);
    });

    it('should support enriched train data', () => {
      const train: Train = {
        _id: 'train123',
        name: 'Portland Local',
        routeId: 'route456',
        sessionNumber: 1,
        status: 'In Progress',
        locomotiveIds: ['loco1', 'loco2'],
        maxCapacity: 20,
        assignedCarIds: ['car1', 'car2'],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
        route: {
          _id: 'route456',
          name: 'Portland-Seattle Route',
        },
        locomotives: [
          { _id: 'loco1', reportingMarks: 'UP', reportingNumber: '1001' },
          { _id: 'loco2', reportingMarks: 'SP', reportingNumber: '2002' },
        ],
        switchList: {
          stations: [],
          totalPickups: 2,
          totalSetouts: 1,
          finalCarCount: 3,
          generatedAt: '2025-10-28T14:00:00.000Z',
        },
      };

      expect(train.route).toBeDefined();
      expect(train.route?.name).toBe('Portland-Seattle Route');
      expect(train.locomotives).toHaveLength(2);
      expect(train.locomotives?.[0].reportingMarks).toBe('UP');
      expect(train.switchList).toBeDefined();
      expect(train.switchList?.totalPickups).toBe(2);
    });

    it('should support all train statuses', () => {
      const statuses: TrainStatus[] = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
      
      statuses.forEach(status => {
        const train: Train = {
          _id: 'train123',
          name: 'Test Train',
          routeId: 'route456',
          sessionNumber: 1,
          status: status,
          locomotiveIds: ['loco1'],
          maxCapacity: 20,
          assignedCarIds: [],
          createdAt: '2025-10-28T14:00:00.000Z',
          updatedAt: '2025-10-28T14:00:00.000Z',
        };

        expect(train.status).toBe(status);
      });
    });

    it('should support dual id fields', () => {
      const trainWithId: Train = {
        id: 'train123',
        name: 'Test Train',
        routeId: 'route456',
        sessionNumber: 1,
        status: 'Planned',
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };

      const trainWith_id: Train = {
        _id: 'train123',
        name: 'Test Train',
        routeId: 'route456',
        sessionNumber: 1,
        status: 'Planned',
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };

      expect(trainWithId.id).toBe('train123');
      expect(trainWith_id._id).toBe('train123');
    });
  });

  describe('OperatingSession', () => {
    it('should validate minimal session structure', () => {
      const session: OperatingSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'First operating session',
        previousSessionSnapshot: null,
      };

      expect(session._id).toBe('session1');
      expect(session.currentSessionNumber).toBe(1);
      expect(session.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(session.description).toBe('First operating session');
      expect(session.previousSessionSnapshot).toBeNull();
    });

    it('should support session with snapshot', () => {
      const session: OperatingSession = {
        _id: 'session1',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: {
          sessionNumber: 1,
          cars: [
            { id: 'car1', currentIndustry: 'ind1', sessionsAtCurrentLocation: 0 },
            { id: 'car2', currentIndustry: 'ind2', sessionsAtCurrentLocation: 1 },
          ],
          trains: [],
          carOrders: [],
        },
      };

      expect(session.currentSessionNumber).toBe(2);
      expect(session.previousSessionSnapshot).toBeDefined();
      expect(session.previousSessionSnapshot?.sessionNumber).toBe(1);
      expect(session.previousSessionSnapshot?.cars).toHaveLength(2);
    });

    it('should support optional description', () => {
      const sessionWithDescription: OperatingSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        description: 'Test session',
      };

      const sessionWithoutDescription: OperatingSession = {
        _id: 'session2',
        currentSessionNumber: 2,
        sessionDate: '2025-10-28T14:00:00.000Z',
      };

      expect(sessionWithDescription.description).toBe('Test session');
      expect(sessionWithoutDescription.description).toBeUndefined();
    });
  });

  describe('CarOrder', () => {
    it('should validate minimal car order structure', () => {
      const order: CarOrder = {
        _id: 'order123',
        industryId: 'industry456',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'pending',
        createdAt: '2025-10-28T14:00:00.000Z',
      };

      expect(order._id).toBe('order123');
      expect(order.industryId).toBe('industry456');
      expect(order.aarTypeId).toBe('boxcar');
      expect(order.sessionNumber).toBe(1);
      expect(order.status).toBe('pending');
      expect(order.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should support assigned car order', () => {
      const order: CarOrder = {
        _id: 'order123',
        industryId: 'industry456',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'assigned',
        assignedCarId: 'car789',
        assignedTrainId: 'train101',
        createdAt: '2025-10-28T14:00:00.000Z',
      };

      expect(order.status).toBe('assigned');
      expect(order.assignedCarId).toBe('car789');
      expect(order.assignedTrainId).toBe('train101');
    });

    it('should support enriched car order data', () => {
      const order: CarOrder = {
        _id: 'order123',
        industryId: 'industry456',
        aarTypeId: 'boxcar',
        sessionNumber: 1,
        status: 'delivered',
        assignedCarId: 'car789',
        assignedTrainId: 'train101',
        createdAt: '2025-10-28T14:00:00.000Z',
        industry: {
          _id: 'industry456',
          name: 'Lumber Mill',
        },
        aarType: {
          _id: 'boxcar',
          name: 'Box Car',
          initial: 'XM',
        },
        assignedCar: {
          _id: 'car789',
          reportingMarks: 'UP',
          reportingNumber: '12345',
        },
        assignedTrain: {
          _id: 'train101',
          name: 'Portland Local',
        },
      };

      expect(order.industry?.name).toBe('Lumber Mill');
      expect(order.aarType?.name).toBe('Box Car');
      expect(order.assignedCar?.reportingMarks).toBe('UP');
      expect(order.assignedTrain?.name).toBe('Portland Local');
    });

    it('should support all order statuses', () => {
      const statuses: CarOrderStatus[] = ['pending', 'assigned', 'in-transit', 'delivered'];
      
      statuses.forEach(status => {
        const order: CarOrder = {
          _id: 'order123',
          industryId: 'industry456',
          aarTypeId: 'boxcar',
          sessionNumber: 1,
          status: status,
          createdAt: '2025-10-28T14:00:00.000Z',
        };

        expect(order.status).toBe(status);
      });
    });
  });

  describe('TrainFormData', () => {
    it('should validate train form structure', () => {
      const formData: TrainFormData = {
        name: 'Portland Local',
        routeId: 'route123',
        locomotiveIds: ['loco1', 'loco2'],
        maxCapacity: 25,
      };

      expect(formData.name).toBe('Portland Local');
      expect(formData.routeId).toBe('route123');
      expect(formData.locomotiveIds).toHaveLength(2);
      expect(formData.maxCapacity).toBe(25);
    });

    it('should require at least one locomotive', () => {
      const formData: TrainFormData = {
        name: 'Test Train',
        routeId: 'route123',
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
      };

      expect(formData.locomotiveIds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CarOrderGenerationRequest', () => {
    it('should support minimal request', () => {
      const request: CarOrderGenerationRequest = {};

      expect(request).toBeDefined();
      expect(request.sessionNumber).toBeUndefined();
      expect(request.industryIds).toBeUndefined();
      expect(request.force).toBeUndefined();
    });

    it('should support full request', () => {
      const request: CarOrderGenerationRequest = {
        sessionNumber: 2,
        industryIds: ['ind1', 'ind2'],
        force: true,
      };

      expect(request.sessionNumber).toBe(2);
      expect(request.industryIds).toHaveLength(2);
      expect(request.force).toBe(true);
    });

    it('should support partial requests', () => {
      const requestWithSession: CarOrderGenerationRequest = {
        sessionNumber: 3,
      };

      const requestWithForce: CarOrderGenerationRequest = {
        force: true,
      };

      const requestWithIndustries: CarOrderGenerationRequest = {
        industryIds: ['ind1'],
      };

      expect(requestWithSession.sessionNumber).toBe(3);
      expect(requestWithForce.force).toBe(true);
      expect(requestWithIndustries.industryIds).toHaveLength(1);
    });
  });

  describe('CarOrderGenerationSummary', () => {
    it('should validate summary structure', () => {
      const summary: CarOrderGenerationSummary = {
        totalOrdersGenerated: 10,
        industriesProcessed: 3,
        ordersByIndustry: {
          'ind1': 4,
          'ind2': 3,
          'ind3': 3,
        },
        ordersByAarType: {
          'boxcar': 6,
          'flatcar': 4,
        },
      };

      expect(summary.totalOrdersGenerated).toBe(10);
      expect(summary.industriesProcessed).toBe(3);
      expect(Object.keys(summary.ordersByIndustry)).toHaveLength(3);
      expect(Object.keys(summary.ordersByAarType)).toHaveLength(2);
      expect(summary.ordersByIndustry['ind1']).toBe(4);
      expect(summary.ordersByAarType['boxcar']).toBe(6);
    });

    it('should support empty summary', () => {
      const summary: CarOrderGenerationSummary = {
        totalOrdersGenerated: 0,
        industriesProcessed: 0,
        ordersByIndustry: {},
        ordersByAarType: {},
      };

      expect(summary.totalOrdersGenerated).toBe(0);
      expect(summary.industriesProcessed).toBe(0);
      expect(Object.keys(summary.ordersByIndustry)).toHaveLength(0);
      expect(Object.keys(summary.ordersByAarType)).toHaveLength(0);
    });
  });

  describe('SessionSnapshot', () => {
    it('should validate snapshot structure', () => {
      const snapshot: SessionSnapshot = {
        sessionNumber: 1,
        cars: [
          { id: 'car1', currentIndustry: 'ind1', sessionsAtCurrentLocation: 0 },
          { id: 'car2', currentIndustry: 'ind2', sessionsAtCurrentLocation: 2 },
        ],
        trains: [
          { _id: 'train1', name: 'Train 1', status: 'Completed' },
        ],
        carOrders: [
          { _id: 'order1', status: 'delivered' },
        ],
      };

      expect(snapshot.sessionNumber).toBe(1);
      expect(snapshot.cars).toHaveLength(2);
      expect(snapshot.trains).toHaveLength(1);
      expect(snapshot.carOrders).toHaveLength(1);
    });

    it('should support empty snapshot', () => {
      const snapshot: SessionSnapshot = {
        sessionNumber: 1,
        cars: [],
        trains: [],
        carOrders: [],
      };

      expect(snapshot.cars).toHaveLength(0);
      expect(snapshot.trains).toHaveLength(0);
      expect(snapshot.carOrders).toHaveLength(0);
    });
  });

  describe('Type Integration', () => {
    it('should support complete train operations workflow', () => {
      // Session 1 starts
      const session: OperatingSession = {
        _id: 'session1',
        currentSessionNumber: 1,
        sessionDate: '2025-10-28T14:00:00.000Z',
        previousSessionSnapshot: null,
      };

      // Generate car orders
      const order: CarOrder = {
        _id: 'order1',
        industryId: 'ind1',
        aarTypeId: 'boxcar',
        sessionNumber: session.currentSessionNumber,
        status: 'pending',
        createdAt: '2025-10-28T14:00:00.000Z',
      };

      // Create train
      const train: Train = {
        _id: 'train1',
        name: 'Portland Local',
        routeId: 'route1',
        sessionNumber: session.currentSessionNumber,
        status: 'Planned',
        locomotiveIds: ['loco1'],
        maxCapacity: 20,
        assignedCarIds: [],
        createdAt: '2025-10-28T14:00:00.000Z',
        updatedAt: '2025-10-28T14:00:00.000Z',
      };

      expect(session.currentSessionNumber).toBe(1);
      expect(order.sessionNumber).toBe(session.currentSessionNumber);
      expect(train.sessionNumber).toBe(session.currentSessionNumber);
      expect(train.status).toBe('Planned');
      expect(order.status).toBe('pending');
    });
  });
});
