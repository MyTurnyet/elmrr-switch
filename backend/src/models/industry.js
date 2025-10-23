import Joi from 'joi';

// Validation schema for car demand configuration
export const carDemandConfigSchema = Joi.object({
  aarTypeId: Joi.string().required().min(1).max(50),
  carsPerSession: Joi.number().integer().min(1).required(),
  frequency: Joi.number().integer().min(1).required()
});

// Validation schema for industries
export const industrySchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  name: Joi.string().required().min(1).max(100),
  stationId: Joi.string().required(),
  goodsReceived: Joi.array().items(Joi.string()).default([]),
  goodsToShip: Joi.array().items(Joi.string()).default([]),
  preferredCarTypes: Joi.array().items(Joi.string()).default([]),
  isYard: Joi.boolean().default(false),
  isOnLayout: Joi.boolean().default(true),
  carDemandConfig: Joi.array().items(carDemandConfigSchema).default([])
});

export const validateIndustry = (data, isUpdate = false) => {
  const schema = isUpdate ? industrySchema.fork(Object.keys(industrySchema.describe().keys), (schema) => schema.optional()) : industrySchema;
  return schema.validate(data);
};

// Helper function to validate car demand configuration
export const validateCarDemandConfig = (demandConfig) => {
  if (!Array.isArray(demandConfig)) {
    return { valid: false, errors: ['carDemandConfig must be an array'] };
  }

  const errors = [];
  const seenAarTypes = new Set();

  demandConfig.forEach((config, index) => {
    const { error } = carDemandConfigSchema.validate(config);
    if (error) {
      errors.push(`Demand config ${index}: ${error.details[0].message}`);
    }

    // Check for duplicate AAR types within the same industry
    if (config.aarTypeId) {
      if (seenAarTypes.has(config.aarTypeId)) {
        errors.push(`Duplicate AAR type '${config.aarTypeId}' in demand configuration`);
      } else {
        seenAarTypes.add(config.aarTypeId);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Helper function to calculate total demand for an industry
export const calculateTotalDemand = (demandConfig, sessionNumber) => {
  if (!Array.isArray(demandConfig)) {
    return 0;
  }

  return demandConfig.reduce((total, config) => {
    // Check if demand should be generated this session
    const shouldGenerate = (sessionNumber % config.frequency) === 0;
    return total + (shouldGenerate ? config.carsPerSession : 0);
  }, 0);
};

// Helper function to get active demand for a specific session
export const getActiveDemandForSession = (demandConfig, sessionNumber) => {
  if (!Array.isArray(demandConfig)) {
    return [];
  }

  return demandConfig.filter(config => {
    return (sessionNumber % config.frequency) === 0;
  });
};

// Helper function to format demand configuration for display
export const formatDemandConfig = (demandConfig) => {
  if (!Array.isArray(demandConfig) || demandConfig.length === 0) {
    return 'No demand configured';
  }

  return demandConfig.map(config => 
    `${config.carsPerSession} ${config.aarTypeId}(s) every ${config.frequency} session(s)`
  ).join(', ');
};
