import Joi from 'joi';

// Valid locomotive manufacturers (model railroad brands)
const VALID_MANUFACTURERS = ['Atlas', 'Kato', 'Lionel', 'Bachmann', 'Athearn', 'Walthers', 'Broadway Limited', 'MTH', 'Rapido'];

// Validation schema for locomotives
export const locomotiveSchema = Joi.object({
  _id: Joi.string().optional(), // Allow custom _id for seed data imports
  reportingMarks: Joi.string().required().min(1).max(10),
  reportingNumber: Joi.string().required().min(1).max(6).pattern(/^[0-9]+$/), // 1-6 digits
  model: Joi.string().required().min(1).max(50),
  manufacturer: Joi.string().required().valid(...VALID_MANUFACTURERS),
  isDCC: Joi.boolean().default(true),
  dccAddress: Joi.number().integer().min(1).max(9999).when('isDCC', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).default(3),
  homeYard: Joi.string().required(), // Industry (yard) ID
  isInService: Joi.boolean().default(true),
  notes: Joi.string().allow('').max(500).default('')
});

export const validateLocomotive = (data, isUpdate = false) => {
  const schema = isUpdate 
    ? locomotiveSchema.fork(Object.keys(locomotiveSchema.describe().keys), (schema) => schema.optional()) 
    : locomotiveSchema;
  return schema.validate(data);
};

/**
 * Helper function to validate locomotive uniqueness
 * Checks if reporting marks + number combination is unique
 * @param {Array} locomotives - Array of all locomotives
 * @param {string} reportingMarks - Reporting marks to check
 * @param {string} reportingNumber - Reporting number to check
 * @param {string} excludeLocomotiveId - ID to exclude from check (for updates)
 * @returns {Object} - { valid: boolean, duplicateLocomotives: Array }
 */
export const validateLocomotiveUniqueness = (locomotives, reportingMarks, reportingNumber, excludeLocomotiveId = null) => {
  const duplicates = locomotives.filter(loco => 
    loco.reportingMarks === reportingMarks && 
    loco.reportingNumber === reportingNumber &&
    loco._id !== excludeLocomotiveId
  );
  
  return {
    valid: duplicates.length === 0,
    duplicateLocomotives: duplicates
  };
};

/**
 * Helper function to validate DCC address uniqueness
 * Checks if DCC address is unique across all DCC-enabled locomotives
 * @param {Array} locomotives - Array of all locomotives
 * @param {number} dccAddress - DCC address to check
 * @param {string} excludeLocomotiveId - ID to exclude from check (for updates)
 * @returns {Object} - { valid: boolean, conflictingLocomotives: Array }
 */
export const validateDccAddressUniqueness = (locomotives, dccAddress, excludeLocomotiveId = null) => {
  if (!dccAddress) {
    return { valid: true, conflictingLocomotives: [] };
  }

  const conflicts = locomotives.filter(loco => 
    loco.isDCC === true &&
    loco.dccAddress === dccAddress &&
    loco._id !== excludeLocomotiveId
  );
  
  return {
    valid: conflicts.length === 0,
    conflictingLocomotives: conflicts
  };
};

/**
 * Helper function to format locomotive summary
 * @param {Object} locomotive - Locomotive object
 * @returns {Object} - Formatted summary
 */
export const formatLocomotiveSummary = (locomotive) => {
  const summary = {
    id: locomotive._id,
    displayName: `${locomotive.reportingMarks} ${locomotive.reportingNumber}`,
    model: locomotive.model,
    manufacturer: locomotive.manufacturer,
    isInService: locomotive.isInService
  };

  if (locomotive.isDCC) {
    // Format DCC address with leading zeros for display (e.g., 3 -> "03", 3801 -> "3801")
    const addressStr = locomotive.dccAddress.toString();
    summary.dccAddress = addressStr.length === 1 ? `0${addressStr}` : addressStr;
  }

  return summary;
};

/**
 * Helper function to format DCC address for display
 * Single digit addresses get leading zero (3 -> "03")
 * @param {number} dccAddress - DCC address number
 * @returns {string} - Formatted DCC address
 */
export const formatDccAddress = (dccAddress) => {
  if (!dccAddress) return '';
  const addressStr = dccAddress.toString();
  return addressStr.length === 1 ? `0${addressStr}` : addressStr;
};

/**
 * Get list of valid manufacturers
 * @returns {Array} - Array of valid manufacturer names
 */
export const getValidManufacturers = () => {
  return [...VALID_MANUFACTURERS];
};
