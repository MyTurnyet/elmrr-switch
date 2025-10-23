import Joi from 'joi';

// Validation schema for switch list pickup/setout items
export const switchListItemSchema = Joi.object({
  carId: Joi.string().required(),
  carReportingMarks: Joi.string().required(),
  carNumber: Joi.string().required(),
  carType: Joi.string().required(),
  destinationIndustryId: Joi.string().required(),
  destinationIndustryName: Joi.string().required(),
  carOrderId: Joi.string().optional().allow(null) // May not have an associated order
});

// Validation schema for switch list station
export const switchListStationSchema = Joi.object({
  stationId: Joi.string().required(),
  stationName: Joi.string().required(),
  pickups: Joi.array().items(switchListItemSchema).default([]),
  setouts: Joi.array().items(switchListItemSchema).default([])
});

// Validation schema for complete switch list
export const switchListSchema = Joi.object({
  stations: Joi.array().items(switchListStationSchema).required(),
  totalPickups: Joi.number().integer().min(0).required(),
  totalSetouts: Joi.number().integer().min(0).required(),
  finalCarCount: Joi.number().integer().min(0).required(),
  generatedAt: Joi.date().iso().required()
});

// Validation schema for trains
export const trainSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  name: Joi.string().required().min(1).max(100),
  routeId: Joi.string().required().min(1).max(100),
  sessionNumber: Joi.number().integer().min(1).required(),
  status: Joi.string().valid('Planned', 'In Progress', 'Completed', 'Cancelled').default('Planned'),
  locomotiveIds: Joi.array().items(Joi.string()).min(1).required(),
  maxCapacity: Joi.number().integer().min(1).max(100).required(),
  switchList: switchListSchema.optional().allow(null),
  assignedCarIds: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().iso().default(() => new Date()),
  updatedAt: Joi.date().iso().default(() => new Date())
});

export const validateTrain = (data, isUpdate = false) => {
  const schema = isUpdate ? trainSchema.fork(Object.keys(trainSchema.describe().keys), (schema) => schema.optional()) : trainSchema;
  return schema.validate(data);
};

// Helper function to validate train name uniqueness within session
export const validateTrainNameUniqueness = (trains, trainName, sessionNumber, excludeTrainId = null) => {
  const duplicates = trains.filter(train => 
    train.name === trainName && 
    train.sessionNumber === sessionNumber &&
    train._id !== excludeTrainId
  );
  
  return {
    valid: duplicates.length === 0,
    duplicateTrains: duplicates
  };
};

// Helper function to validate locomotive assignments
export const validateLocomotiveAssignments = (trains, locomotiveIds, excludeTrainId = null) => {
  const conflicts = [];
  const activeStatuses = ['Planned', 'In Progress'];
  
  for (const locoId of locomotiveIds) {
    const conflictingTrains = trains.filter(train =>
      train._id !== excludeTrainId &&
      activeStatuses.includes(train.status) &&
      train.locomotiveIds.includes(locoId)
    );
    
    if (conflictingTrains.length > 0) {
      conflicts.push({
        locomotiveId: locoId,
        conflictingTrains: conflictingTrains.map(t => ({ id: t._id, name: t.name, status: t.status }))
      });
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
};

// Helper function to validate status transitions
export const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'Planned': ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
    'Completed': [], // Final state
    'Cancelled': []  // Final state
  };
  
  const allowed = validTransitions[currentStatus] || [];
  return {
    valid: allowed.includes(newStatus),
    allowedTransitions: allowed
  };
};

// Helper function to calculate train capacity usage
export const calculateCapacityUsage = (switchList) => {
  if (!switchList || !switchList.stations) {
    return {
      currentLoad: 0,
      maxLoad: 0,
      finalLoad: 0
    };
  }
  
  let currentLoad = 0;
  let maxLoad = 0;
  
  for (const station of switchList.stations) {
    // Add pickups, subtract setouts
    currentLoad += station.pickups.length;
    currentLoad -= station.setouts.length;
    
    // Track maximum load during the trip
    maxLoad = Math.max(maxLoad, currentLoad);
  }
  
  return {
    currentLoad: 0, // Starting load (could be enhanced to support cars already on train)
    maxLoad,
    finalLoad: currentLoad
  };
};

// Helper function to format train summary
export const formatTrainSummary = (train) => {
  const summary = {
    id: train._id,
    name: train.name,
    status: train.status,
    sessionNumber: train.sessionNumber,
    locomotiveCount: train.locomotiveIds.length,
    maxCapacity: train.maxCapacity,
    assignedCars: train.assignedCarIds.length
  };
  
  if (train.switchList) {
    const capacity = calculateCapacityUsage(train.switchList);
    summary.switchList = {
      totalStations: train.switchList.stations.length,
      totalPickups: train.switchList.totalPickups,
      totalSetouts: train.switchList.totalSetouts,
      maxLoad: capacity.maxLoad,
      finalCarCount: train.switchList.finalCarCount
    };
  }
  
  return summary;
};

// Helper function to validate switch list generation requirements
export const validateSwitchListRequirements = (train, route, locomotives) => {
  const errors = [];
  
  if (train.status !== 'Planned') {
    errors.push(`Cannot generate switch list for train with status: ${train.status}`);
  }
  
  if (!route) {
    errors.push('Route not found');
  }
  
  if (!locomotives || locomotives.length === 0) {
    errors.push('No locomotives found for this train');
  } else {
    const inactiveLocos = locomotives.filter(loco => !loco.isInService);
    if (inactiveLocos.length > 0) {
      errors.push(`Inactive locomotives: ${inactiveLocos.map(l => l.reportingMarks).join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
