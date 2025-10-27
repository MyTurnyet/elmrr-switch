/**
 * Type definitions for service factory
 */

import { TrainService } from './TrainService.js';
import { SessionService } from './SessionService.js';
import { CarOrderService } from './CarOrderService.js';

export type ServiceName = 'train' | 'session' | 'carOrder';

export type ServiceType<T extends ServiceName> = 
  T extends 'train' ? TrainService :
  T extends 'session' ? SessionService :
  T extends 'carOrder' ? CarOrderService :
  never;

/**
 * Get or create a service instance
 */
export declare function getService<T extends ServiceName>(serviceName: T): ServiceType<T>;

/**
 * Get all available service names
 */
export declare function getAvailableServices(): ServiceName[];

/**
 * Clear service cache (useful for testing)
 */
export declare function clearServiceCache(): void;

// Export specific services for direct access
export { TrainService } from './TrainService.js';
export { SessionService } from './SessionService.js';
export { CarOrderService } from './CarOrderService.js';
