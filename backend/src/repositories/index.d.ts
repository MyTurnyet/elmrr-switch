/**
 * Type definitions for repository factory
 */

import { BaseRepository } from './BaseRepository.js';
import { TrainRepository } from './TrainRepository.js';
import { AarTypeRepository } from './AarTypeRepository.js';

export type EntityName = 
  | 'trains'
  | 'aarTypes'
  | 'cars'
  | 'locomotives'
  | 'stations'
  | 'routes'
  | 'industries'
  | 'blocks'
  | 'tracks'
  | 'goods'
  | 'carOrders'
  | 'operatingSessions';

export type RepositoryType<T extends EntityName> = 
  T extends 'trains' ? TrainRepository :
  T extends 'aarTypes' ? AarTypeRepository :
  BaseRepository;

/**
 * Get or create a repository instance
 */
export declare function getRepository<T extends EntityName>(
  entityName: T
): RepositoryType<T>;

/**
 * Get all available repository names
 */
export declare function getAvailableRepositories(): EntityName[];

/**
 * Clear repository cache (useful for testing)
 */
export declare function clearRepositoryCache(): void;

/**
 * Get repository statistics for all entities
 */
export declare function getAllRepositoryStats(): Promise<Record<string, any>>;

// Export specific repositories for direct access
export { BaseRepository } from './BaseRepository.js';
export { TrainRepository } from './TrainRepository.js';
export { AarTypeRepository } from './AarTypeRepository.js';
