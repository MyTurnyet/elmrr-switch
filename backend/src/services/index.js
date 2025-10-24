/**
 * Service Factory - Centralized access to all services
 * Implements singleton pattern to ensure single instances
 */

import { TrainService } from './TrainService.js';
import { SessionService } from './SessionService.js';
import { CarOrderService } from './CarOrderService.js';

// Service instances cache
const services = new Map();

/**
 * Get or create a service instance
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service instance
 */
export function getService(serviceName) {
  // Return cached instance if exists
  if (services.has(serviceName)) {
    return services.get(serviceName);
  }

  let service;

  // Create specific service instances
  switch (serviceName) {
    case 'train':
      service = new TrainService();
      break;
    case 'session':
      service = new SessionService();
      break;
    case 'carOrder':
      service = new CarOrderService();
      break;
    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }

  // Cache the instance
  services.set(serviceName, service);
  return service;
}

/**
 * Get all available service names
 * @returns {Array<string>} Array of service names
 */
export function getAvailableServices() {
  return [
    'train',
    'session',
    'carOrder'
  ];
}

/**
 * Clear service cache (useful for testing)
 */
export function clearServiceCache() {
  services.clear();
}

// Export specific services for direct access
export { TrainService } from './TrainService.js';
export { SessionService } from './SessionService.js';
export { CarOrderService } from './CarOrderService.js';
