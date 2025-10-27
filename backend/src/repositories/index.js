/**
 * Repository Factory - Centralized access to all repositories
 * Implements singleton pattern to ensure single instances
 */

import { BaseRepository } from './BaseRepository.js';
import { TrainRepository } from './TrainRepository.js';
import { AarTypeRepository } from './AarTypeRepository.js';
import { CarRepository } from './CarRepository.js';
import { IndustryRepository } from './IndustryRepository.js';
import { RouteRepository } from './RouteRepository.js';
import { CarOrderRepository } from './CarOrderRepository.js';
import { OperatingSessionRepository } from './OperatingSessionRepository.js';
import { LocomotiveRepository } from './LocomotiveRepository.js';
import { StationRepository } from './StationRepository.js';

// Repository instances cache
const repositories = new Map();

/**
 * Get or create a repository instance
 * @param {string} entityName - Name of the entity
 * @returns {BaseRepository} Repository instance
 */
export function getRepository(entityName) {
  // Return cached instance if exists
  if (repositories.has(entityName)) {
    return repositories.get(entityName);
  }

  let repository;

  // Create specific repository instances
  switch (entityName) {
    case 'trains':
      repository = new TrainRepository();
      break;
    case 'aarTypes':
      repository = new AarTypeRepository();
      break;
    case 'cars':
      repository = new CarRepository();
      break;
    case 'industries':
      repository = new IndustryRepository();
      break;
    case 'routes':
      repository = new RouteRepository();
      break;
    case 'carOrders':
      repository = new CarOrderRepository();
      break;
    case 'operatingSessions':
      repository = new OperatingSessionRepository();
      break;
    case 'locomotives':
      repository = new LocomotiveRepository();
      break;
    case 'stations':
      repository = new StationRepository();
      break;
    // Entities without specific repositories yet
    case 'blocks':
    case 'tracks':
    case 'goods':
      // Use base repository for entities without specific repositories
      repository = new BaseRepository(entityName);
      break;
    default:
      throw new Error(`Unknown entity: ${entityName}`);
  }

  // Cache the instance
  repositories.set(entityName, repository);
  return repository;
}

/**
 * Get all available repository names
 * @returns {Array<string>} Array of entity names
 */
export function getAvailableRepositories() {
  return [
    'trains',
    'aarTypes',
    'cars',
    'locomotives',
    'stations',
    'routes',
    'industries',
    'blocks',
    'tracks',
    'goods',
    'carOrders',
    'operatingSessions'
  ];
}

/**
 * Clear repository cache (useful for testing)
 */
export function clearRepositoryCache() {
  repositories.clear();
}

/**
 * Get repository statistics for all entities
 * @returns {Promise<Object>} Statistics for all repositories
 */
export async function getAllRepositoryStats() {
  const stats = {};
  const entityNames = getAvailableRepositories();

  for (const entityName of entityNames) {
    try {
      const repository = getRepository(entityName);
      stats[entityName] = await repository.getStats();
    } catch (error) {
      stats[entityName] = {
        error: error.message,
        collectionName: entityName
      };
    }
  }

  return {
    timestamp: new Date().toISOString(),
    repositories: stats,
    totalRepositories: entityNames.length
  };
}

// Export specific repositories for direct access
export { BaseRepository } from './BaseRepository.js';
export { TrainRepository } from './TrainRepository.js';
export { AarTypeRepository } from './AarTypeRepository.js';
export { CarRepository } from './CarRepository.js';
export { IndustryRepository } from './IndustryRepository.js';
export { RouteRepository } from './RouteRepository.js';
export { CarOrderRepository } from './CarOrderRepository.js';
export { OperatingSessionRepository } from './OperatingSessionRepository.js';
export { LocomotiveRepository } from './LocomotiveRepository.js';
export { StationRepository } from './StationRepository.js';
