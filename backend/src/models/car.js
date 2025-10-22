import Joi from 'joi';

// Validation schema for rolling stock (cars)
export const carSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  reportingMarks: Joi.string().required().min(1).max(10),
  reportingNumber: Joi.string().required().min(1).max(10),
  carType: Joi.string().required(), // AAR Type ID
  color: Joi.string().required().min(1).max(50),
  notes: Joi.string().allow('').max(500),
  currentLoad: Joi.string().allow(''), // Goods ID
  homeYard: Joi.string().required(), // Industry ID
  currentIndustry: Joi.string().required(), // Industry ID
  isInService: Joi.boolean().default(true),
  lastMoved: Joi.date(),
  sessionsAtCurrentLocation: Joi.number().integer().min(0).default(0)
});

export const validateCar = (data, isUpdate = false) => {
  const schema = isUpdate ? carSchema.fork(Object.keys(carSchema.describe().keys), (schema) => schema.optional()) : carSchema;
  return schema.validate(data);
};
