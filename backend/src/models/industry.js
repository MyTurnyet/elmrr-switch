import Joi from 'joi';

// Validation schema for car demand configuration
export const carDemandConfigSchema = Joi.object({
  goodsId: Joi.string().required().min(1).max(50),
  direction: Joi.string().valid('inbound', 'outbound').required(),
  compatibleCarTypes: Joi.array().items(Joi.string().min(1).max(50)).min(1).required(),
  carsPerSession: Joi.number().integer().min(1).required(),
  frequency: Joi.number().integer().min(1).required()
});

// Validation schema for industries
export const industrySchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  name: Joi.string().required().min(1).max(100),
  stationId: Joi.string().required(),
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
  const seenCombinations = new Set();

  demandConfig.forEach((config, index) => {
    const { error } = carDemandConfigSchema.validate(config);
    if (error) {
      errors.push(`Demand config ${index}: ${error.details[0].message}`);
    }

    // Check for duplicate (goodsId + direction) combinations within the same industry
    if (config.goodsId && config.direction) {
      const key = `${config.goodsId}:${config.direction}`;
      if (seenCombinations.has(key)) {
        errors.push(`Duplicate combination of goods '${config.goodsId}' with direction '${config.direction}' in demand configuration`);
      } else {
        seenCombinations.add(key);
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
    `${config.direction}: ${config.carsPerSession} car(s) of ${config.goodsId} (${config.compatibleCarTypes.join('/')}) every ${config.frequency} session(s)`
  ).join(', ');
};

// Helper function to get inbound demand configurations
export const getInboundDemand = (demandConfig) => {
  if (!Array.isArray(demandConfig)) {
    return [];
  }
  return demandConfig.filter(config => config.direction === 'inbound');
};

// Helper function to get outbound demand configurations
export const getOutboundDemand = (demandConfig) => {
  if (!Array.isArray(demandConfig)) {
    return [];
  }
  return demandConfig.filter(config => config.direction === 'outbound');
};

// Helper function to get all goods handled by an industry
export const getIndustryGoods = (demandConfig) => {
  if (!Array.isArray(demandConfig)) {
    return { inbound: [], outbound: [] };
  }
  
  const inbound = [...new Set(demandConfig
    .filter(config => config.direction === 'inbound')
    .map(config => config.goodsId))];
  
  const outbound = [...new Set(demandConfig
    .filter(config => config.direction === 'outbound')
    .map(config => config.goodsId))];
  
  return { inbound, outbound };
};

// Helper function to get compatible car types for a specific good and direction
export const getCompatibleCarTypesForGood = (demandConfig, goodsId, direction) => {
  if (!Array.isArray(demandConfig)) {
    return [];
  }
  
  const config = demandConfig.find(
    c => c.goodsId === goodsId && c.direction === direction
  );
  
  return config ? config.compatibleCarTypes : [];
};
