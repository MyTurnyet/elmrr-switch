import Joi from 'joi';

// Validation schema for car orders
export const carOrderSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  industryId: Joi.string().required().min(1).max(100),
  aarTypeId: Joi.string().required().min(1).max(50),
  sessionNumber: Joi.number().integer().min(1).required(),
  status: Joi.string().valid('pending', 'assigned', 'in-transit', 'delivered').default('pending'),
  assignedCarId: Joi.string().optional().allow(null).max(100),
  assignedTrainId: Joi.string().optional().allow(null).max(100),
  createdAt: Joi.date().iso().default(() => new Date())
});

export const validateCarOrder = (data, isUpdate = false) => {
  const schema = isUpdate ? carOrderSchema.fork(Object.keys(carOrderSchema.describe().keys), (schema) => schema.optional()) : carOrderSchema;
  return schema.validate(data);
};

// Helper function to validate order generation request
export const validateOrderGeneration = (data) => {
  const generationSchema = Joi.object({
    sessionNumber: Joi.number().integer().min(1).optional(), // If not provided, use current session
    industryIds: Joi.array().items(Joi.string()).optional(), // If provided, only generate for these industries
    force: Joi.boolean().default(false) // Force generation even if orders already exist for session
  });
  
  return generationSchema.validate(data);
};

// Helper function to create order generation summary
export const createOrderGenerationSummary = (orders, industryDemands) => {
  const summary = {
    totalOrdersGenerated: orders.length,
    industriesProcessed: industryDemands.length,
    ordersByIndustry: {},
    ordersByAarType: {}
  };

  // Group orders by industry and AAR type for summary
  orders.forEach(order => {
    // By industry
    if (!summary.ordersByIndustry[order.industryId]) {
      summary.ordersByIndustry[order.industryId] = 0;
    }
    summary.ordersByIndustry[order.industryId]++;

    // By AAR type
    if (!summary.ordersByAarType[order.aarTypeId]) {
      summary.ordersByAarType[order.aarTypeId] = 0;
    }
    summary.ordersByAarType[order.aarTypeId]++;
  });

  return summary;
};

// Helper function to validate car assignment
export const validateCarAssignment = (carOrder, car) => {
  const errors = [];

  if (!car) {
    errors.push('Car not found');
    return { valid: false, errors };
  }

  if (!car.isInService) {
    errors.push('Car is not in service');
  }

  if (car.carType !== carOrder.aarTypeId) {
    errors.push(`Car type mismatch: order requires ${carOrder.aarTypeId}, car is ${car.carType}`);
  }

  if (carOrder.status !== 'pending') {
    errors.push(`Cannot assign car to order with status: ${carOrder.status}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Helper function to check for duplicate orders
export const checkDuplicateOrder = (existingOrders, newOrder) => {
  return existingOrders.some(order => 
    order.industryId === newOrder.industryId &&
    order.aarTypeId === newOrder.aarTypeId &&
    order.sessionNumber === newOrder.sessionNumber &&
    order.status === 'pending'
  );
};

// Status transition validation
export const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'pending': ['assigned', 'delivered'], // Can skip in-transit for direct delivery
    'assigned': ['in-transit', 'delivered', 'pending'], // Can revert to pending if train cancelled
    'in-transit': ['delivered', 'assigned'], // Can revert if train cancelled
    'delivered': [] // Final state, no transitions allowed
  };

  const allowed = validTransitions[currentStatus] || [];
  return {
    valid: allowed.includes(newStatus),
    allowedTransitions: allowed
  };
};
