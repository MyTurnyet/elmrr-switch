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

### 🔄 Phase 2 In Progress: Transformers

#### Completed
- ✅ `BaseTransformer.ts` - Generic base class with complete type annotations (203 lines)
  - All 14 methods fully typed
  - Generic class with `<T extends BaseEntity, R>`
  - Type guards, union types, literal types
  - Strict null checks throughout

#### In Progress
- 🔄 Entity transformers being migrated
  - CarTransformer
  - TrainTransformer
  - LocomotiveTransformer
  - IndustryTransformer
  - SimpleTransformer (6 entity transformers)

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

### Phase 2: Transformers (In Progress)
- [ ] Complete BaseTransformer type annotations
- [ ] Migrate CarTransformer
- [ ] Migrate TrainTransformer
- [ ] Migrate LocomotiveTransformer
- [ ] Migrate IndustryTransformer
- [ ] Migrate SimpleTransformer

### Phase 3: Services
- [ ] Add service interfaces
- [ ] Migrate TrainService
- [ ] Migrate SessionService
- [ ] Migrate CarOrderService

### Phase 4: Routes
- [ ] Add Express types
- [ ] Migrate route handlers
- [ ] Type request/response objects

### Phase 5: Models
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
**Status**: Phase 1 Complete, Phase 2 In Progress  
**Branch**: refactor/typescript-migration
