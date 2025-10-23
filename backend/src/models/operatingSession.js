import Joi from 'joi';

// Validation schema for operating sessions
// Note: This is a singleton pattern - only ONE operating session record should exist
export const operatingSessionSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  currentSessionNumber: Joi.number().integer().min(1).default(1),
  sessionDate: Joi.date().iso().default(() => new Date()),
  description: Joi.string().allow('').max(500).default(''),
  previousSessionSnapshot: Joi.object({
    sessionNumber: Joi.number().integer().min(1).required(),
    cars: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      currentIndustry: Joi.string().required(),
      sessionsAtCurrentLocation: Joi.number().integer().min(0).required()
    })).default([]),
    trains: Joi.array().items(Joi.object().unknown()).default([]), // Full train objects
    carOrders: Joi.array().items(Joi.object().unknown()).default([]) // Full car order objects
  }).optional().allow(null) // null means no previous session (can't rollback)
});

export const validateOperatingSession = (data, isUpdate = false) => {
  const schema = isUpdate ? operatingSessionSchema.fork(Object.keys(operatingSessionSchema.describe().keys), (schema) => schema.optional()) : operatingSessionSchema;
  return schema.validate(data);
};

// Helper function to create snapshot of current state for rollback
export const createSessionSnapshot = (sessionNumber, cars, trains, carOrders) => {
  return {
    sessionNumber,
    cars: cars.map(car => ({
      id: car._id || car.id,
      currentIndustry: car.currentIndustry,
      sessionsAtCurrentLocation: car.sessionsAtCurrentLocation || 0
    })),
    trains: trains || [],
    carOrders: carOrders || []
  };
};

// Validate snapshot structure
export const validateSnapshot = (snapshot) => {
  const snapshotSchema = Joi.object({
    sessionNumber: Joi.number().integer().min(1).required(),
    cars: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      currentIndustry: Joi.string().required(),
      sessionsAtCurrentLocation: Joi.number().integer().min(0).required()
    })).required(),
    trains: Joi.array().items(Joi.object().unknown()).required(),
    carOrders: Joi.array().items(Joi.object().unknown()).required()
  });
  
  return snapshotSchema.validate(snapshot);
};
