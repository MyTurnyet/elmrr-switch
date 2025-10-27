# TypeScript Migration Guide

## Overview

This document outlines the gradual migration strategy from JavaScript to TypeScript for the ELMRR Switch Backend. The migration follows a phased approach to minimize disruption while adding type safety.

## Migration Strategy

### Gradual Migration Approach

We're using a **gradual migration** strategy where JavaScript and TypeScript coexist:

1. ✅ **Phase 1**: Infrastructure (types, interfaces, configuration)
2. 🔄 **Phase 2**: Transformers and utilities
3. ⏳ **Phase 3**: Services and repositories
4. ⏳ **Phase 4**: Routes and middleware
5. ⏳ **Phase 5**: Models and validation

### Why Gradual?

- ✅ **No Breaking Changes** - Existing code continues to work
- ✅ **Incremental Benefits** - Get type safety immediately for new code
- ✅ **Lower Risk** - Smaller changes, easier to test
- ✅ **Team Friendly** - Developers can learn TypeScript gradually
- ✅ **Flexible Timeline** - No pressure to migrate everything at once

## Current Status

### ✅ Phase 1 Complete: Infrastructure

#### TypeScript Configuration
- `tsconfig.json` with strict mode enabled
- ES2022 target with ES modules
- Source maps and declarations
- Comprehensive type checking rules

#### Type Definitions Created

**`src/types/models.ts`** - All entity types:
```typescript
export interface Car extends BaseEntity {
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  isInService: boolean;
  // ... other fields
}
```

**`src/types/transformers.ts`** - Transformer interfaces:
```typescript
export interface ITransformer<T extends BaseEntity, R = any> {
  transform(entity: T, options?: TransformOptions): R | null;
  transformCollection(entities: T[], options?: TransformOptions): R[];
  // ... other methods
}
```

#### Dependencies Installed
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions
- `@types/cors`, `@types/morgan` - Middleware types
- `@types/jest`, `@types/supertest` - Testing types
- `ts-node` - TypeScript execution
- `ts-jest` - Jest TypeScript support

### ✅ Phase 2 Complete: Transformers

#### All Transformers Migrated
- ✅ `BaseTransformer.ts` - Generic base class (203 lines)
  - All 14 methods fully typed
  - Generic class with `<T extends BaseEntity, R>`
  - Type guards, union types, literal types
  - Strict null checks throughout

- ✅ `CarTransformer.ts` - Car entity transformer (170 lines)
  - Extends `BaseTransformer<Car, TransformedCar>`
  - All methods with proper types
  - Private methods with visibility modifiers

- ✅ `TrainTransformer.ts` - Train entity transformer (250 lines)
  - Extends `BaseTransformer<Train, TransformedTrain>`
  - Complex switch list types
  - Route and locomotive enrichment

- ✅ `LocomotiveTransformer.ts` - Locomotive transformer (150 lines)
  - Extends `BaseTransformer<Locomotive, TransformedLocomotive>`
  - Status and statistics types

- ✅ `IndustryTransformer.ts` - Industry transformer (200 lines)
  - Extends `BaseTransformer<Industry, TransformedIndustry>`
  - Car demand configuration types
  - Session demand calculations

- ✅ `SimpleTransformer.ts` - Generic simple entities (220 lines)
  - Extends `BaseTransformer<BaseEntity, any>`
  - 6 entity transformers (Station, Good, AarType, Block, Track, Route)

- ✅ `index.ts` - Transformer factory (170 lines)
  - Generic factory functions
  - Type-safe transformer registry
  - All utility functions typed

**Total: ~1,400 lines of TypeScript transformer code**

### ✅ Phase 3 Complete: Services

#### All Services Migrated
- ✅ `src/types/services.ts` - Service type definitions (140 lines)
  - ITrainService, ISessionService, ICarOrderService interfaces
  - Result types (SessionAdvanceResult, OrderGenerationResult, etc.)
  - ServiceError class
  - IServiceFactory interface

- ✅ `TrainService.ts` - Train business operations (380 lines)
  - Implements ITrainService
  - Switch list generation with types
  - Train completion and cancellation
  - Private repository properties

- ✅ `SessionService.ts` - Session management (250 lines)
  - Implements ISessionService
  - Session advance/rollback with typed results
  - Session statistics
  - Snapshot management

- ✅ `CarOrderService.ts` - Car order operations (200 lines)
  - Implements ICarOrderService
  - Order generation with typed results
  - Filter queries with CarOrderFilters type
  - Car assignment validation

**Total: ~970 lines of TypeScript service code**

## Using TypeScript in the Project

### Importing Types

```typescript
// Import specific types
import type { Car, Train, Locomotive } from '../types/index.js';

// Import transformer types
import type { ITransformer, TransformOptions } from '../types/index.js';

// Use in function signatures
function processCar(car: Car): void {
  console.log(car.reportingMarks);
}
```

### Type-Safe Transformers

```typescript
import { BaseTransformer } from './BaseTransformer.js';
import type { Car, TransformedCar } from '../types/index.js';

export class CarTransformer extends BaseTransformer<Car, TransformedCar> {
  transform(car: Car | null, options: TransformOptions = {}): TransformedCar | null {
    if (!car) return null;
    
    return {
      id: car._id,
      reportingMarks: car.reportingMarks,
      // TypeScript ensures all required fields are present
    };
  }
}
```

### JavaScript Interoperability

TypeScript files can import JavaScript files:
```typescript
// TypeScript file importing JavaScript
import { dbHelpers } from '../database/index.js'; // Still .js extension
```

JavaScript files can import TypeScript files (after compilation):
```javascript
// JavaScript file importing TypeScript
import { BaseTransformer } from './BaseTransformer.js'; // Works!
```

## Migration Guidelines

### When to Use TypeScript

**Migrate to TypeScript:**
- ✅ New files being created
- ✅ Files undergoing major refactoring
- ✅ Utility functions and helpers
- ✅ Transformers and data processors
- ✅ Type definitions and interfaces

**Keep as JavaScript (for now):**
- ⏳ Files with complex Joi validation
- ⏳ Files with extensive mocking in tests
- ⏳ Files that are stable and working well

### File Naming Convention

- TypeScript files: `.ts` extension
- TypeScript files are compiled to `.js` in `dist/` directory
- Imports always use `.js` extension (even for `.ts` files)

### Type Annotations

**Start with function signatures:**
```typescript
// Before (JavaScript)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (TypeScript)
function calculateTotal(items: Array<{price: number}>): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Add return types:**
```typescript
// Explicit return type
function getCar(id: string): Car | null {
  return dbHelpers.findById('cars', id);
}

// Inferred return type (TypeScript figures it out)
function getCarName(car: Car) {
  return `${car.reportingMarks} ${car.reportingNumber}`;
}
```

**Use type guards:**
```typescript
function isCar(entity: any): entity is Car {
  return entity && typeof entity.reportingMarks === 'string';
}

if (isCar(someEntity)) {
  // TypeScript knows someEntity is a Car here
  console.log(someEntity.reportingMarks);
}
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true
  },
  "include": ["src/**/*.ts", "src/**/*.js"],
  "exclude": ["node_modules", "dist"]
}
```

### Key Settings

- **`strict: true`** - Enable all strict type checking
- **`noImplicitAny: true`** - Require explicit types
- **`strictNullChecks: true`** - Catch null/undefined errors
- **`esModuleInterop: true`** - Better CommonJS interop
- **`declaration: true`** - Generate .d.ts files

## Build Process

### Development

```bash
# Run TypeScript files directly
npm run dev

# Type check without compiling
npx tsc --noEmit
```

### Production

```bash
# Compile TypeScript to JavaScript
npx tsc

# Output goes to dist/ directory
node dist/server.js
```

### Testing

```bash
# Jest automatically handles TypeScript via ts-jest
npm test
```

## Common Patterns

### Optional Properties

```typescript
interface Car {
  id: string;
  color?: string; // Optional property
}

// Usage
const car: Car = { id: '123' }; // Valid, color is optional
```

### Union Types

```typescript
type TrainStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

function updateStatus(status: TrainStatus) {
  // TypeScript ensures only valid statuses
}
```

### Generic Functions

```typescript
function findById<T extends BaseEntity>(
  collection: string,
  id: string
): T | null {
  // TypeScript knows the return type
  return dbHelpers.findById(collection, id);
}

// Usage
const car = findById<Car>('cars', 'car123'); // car is typed as Car
```

### Type Assertions

```typescript
// When you know more than TypeScript
const car = entity as Car;

// Safer: type guard
if (isCar(entity)) {
  // TypeScript knows entity is Car
}
```

## Benefits Achieved

### Type Safety

```typescript
// TypeScript catches errors at compile time
const car: Car = {
  reportingMarks: 'ATSF',
  reportingNumber: '12345',
  // Error: Missing required property 'carType'
};
```

### IDE Support

- ✅ Autocomplete for properties and methods
- ✅ Inline documentation
- ✅ Refactoring support
- ✅ Go to definition
- ✅ Find all references

### Documentation

Types serve as living documentation:
```typescript
// Clear function signature
function generateSwitchList(
  train: Train,
  route: Route,
  cars: Car[]
): SwitchListStation[] {
  // Implementation
}
```

### Refactoring Confidence

- TypeScript catches breaking changes
- Rename refactorings are safe
- Interface changes are tracked

## Migration Checklist

### For Each File

- [ ] Create `.ts` version alongside `.js`
- [ ] Add type imports
- [ ] Add function parameter types
- [ ] Add return types
- [ ] Fix any type errors
- [ ] Test thoroughly
- [ ] Remove `.js` version
- [ ] Update imports in other files

### Testing

- [ ] All existing tests pass
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] No `any` types (except where necessary)
- [ ] Proper null checks

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module` errors
```typescript
// Wrong
import { Car } from '../types/models';

// Correct - always use .js extension
import { Car } from '../types/models.js';
```

**Issue**: `Type 'X' is not assignable to type 'Y'`
```typescript
// Check your type definitions
// Use type assertions if you're certain
const value = unknownValue as ExpectedType;
```

**Issue**: `Object is possibly 'null'`
```typescript
// Add null check
if (car !== null) {
  console.log(car.reportingMarks); // Safe
}

// Or use optional chaining
console.log(car?.reportingMarks);
```

## Resources

### TypeScript Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### Project-Specific
- `src/types/` - All type definitions
- `tsconfig.json` - TypeScript configuration
- This document - Migration guide

## Next Steps

### ✅ Phase 1: Infrastructure (COMPLETE)
- [x] Install TypeScript and dependencies
- [x] Create tsconfig.json
- [x] Create type definitions (models, transformers, services)
- [x] Set up build process

### ✅ Phase 2: Transformers (COMPLETE)
- [x] Complete BaseTransformer type annotations
- [x] Migrate CarTransformer
- [x] Migrate TrainTransformer
- [x] Migrate LocomotiveTransformer
- [x] Migrate IndustryTransformer
- [x] Migrate SimpleTransformer
- [x] Migrate transformer factory

### ✅ Phase 3: Services (COMPLETE)
- [x] Add service interfaces
- [x] Migrate TrainService
- [x] Migrate SessionService
- [x] Migrate CarOrderService

### 🔄 Phase 4: Routes (IN PROGRESS)
- [ ] Add Express types for routes
- [ ] Create route type definitions
- [ ] Migrate cars route
- [ ] Migrate trains route
- [ ] Migrate other routes
- [ ] Type request/response objects

### Phase 5: Models (Optional)
- [ ] Integrate with Joi validation
- [ ] Add model types
- [ ] Type validation functions

## Success Metrics

- [ ] 50% of codebase in TypeScript
- [ ] Zero `any` types (except external libraries)
- [ ] All new code in TypeScript
- [ ] Type checking in CI/CD
- [ ] Developer satisfaction improved

---

**Last Updated**: October 27, 2025  
**Status**: Phases 1-3 Complete, Phase 4 In Progress  
**Progress**: ~60% of planned migration complete  
**Branch**: refactor/typescript-migration
