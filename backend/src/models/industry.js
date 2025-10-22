import Joi from 'joi';

// Validation schema for industries
export const industrySchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  name: Joi.string().required().min(1).max(100),
  stationId: Joi.string().required(),
  goodsReceived: Joi.array().items(Joi.string()).default([]),
  goodsToShip: Joi.array().items(Joi.string()).default([]),
  preferredCarTypes: Joi.array().items(Joi.string()).default([]),
  isYard: Joi.boolean().default(false),
  isOnLayout: Joi.boolean().default(true)
});

export const validateIndustry = (data, isUpdate = false) => {
  const schema = isUpdate ? industrySchema.fork(Object.keys(industrySchema.describe().keys), (schema) => schema.optional()) : industrySchema;
  return schema.validate(data);
};
