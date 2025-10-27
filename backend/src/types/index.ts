/**
 * Type Definitions Index
 * 
 * Central export point for all TypeScript type definitions.
 * Import types from this file throughout the application.
 */

// Model types
export * from './models.js';

// Transformer types
export * from './transformers.js';

// Service types
export * from './services.js';

// Express types
export * from './express.js';

// Re-export commonly used types for convenience
export type {
  BaseEntity,
  Car,
  Train,
  Locomotive,
  Industry,
  Station,
  Good,
  AarType,
  Block,
  Track,
  Route,
  CarOrder,
  OperatingSession
} from './models.js';

export type {
  ITransformer,
  TransformedEntity,
  TransformedCar,
  TransformedTrain,
  TransformedLocomotive,
  TransformedIndustry,
  QueryParams,
  TransformerFactory
} from './transformers.js';
