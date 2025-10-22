import Joi from 'joi';

// Validation schema for routes
export const routeSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().allow('').max(500),
  originYard: Joi.string().required(), // Industry ID where isYard=true
  terminationYard: Joi.string().required(), // Industry ID where isYard=true
  stationSequence: Joi.array().items(Joi.string()).default([]) // Array of Station IDs (can be empty)
});

export const validateRoute = (data, isUpdate = false) => {
  const schema = isUpdate ? routeSchema.fork(Object.keys(routeSchema.describe().keys), (schema) => schema.optional()) : routeSchema;
  return schema.validate(data);
};
