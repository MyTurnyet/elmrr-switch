# Null Object Pattern - Quick Reference

## What It Solves

**Problem:** Repetitive null checks throughout the codebase
```typescript
// Current code (verbose)
const car = await carRepo.findById(id);
if (!car) {
  throw new ApiError('Car not found', 404);
}
console.log(car.reportingMarks);
```

**Solution:** Null objects provide safe defaults
```typescript
// With Null Object pattern (clean)
const car = await carRepo.findByIdOrNull(id);
throwIfNull(car, 'Car not found', 404);
console.log(car.reportingMarks); // Safe even if NullCar
```

---

## Quick Start

### 1. Create Null Object
```typescript
export class NullCar extends NullObject implements Car {
  readonly isNull = true;
  readonly reportingMarks = 'UNKNOWN';
  readonly reportingNumber = '0000';
  // ... safe defaults for all fields
}

export const NULL_CAR = new NullCar();
```

### 2. Update Repository
```typescript
class CarRepository {
  async findByIdOrNull(id: string): Promise<Car> {
    const car = await this.findById(id);
    return car || NULL_CAR;
  }
}
```

### 3. Use in Services
```typescript
const car = await carRepo.findByIdOrNull(id);
throwIfNull(car, 'Car not found', 404);
// car is guaranteed to be valid here
```

---

## Benefits

✅ **Eliminates null checks** - Reduce defensive programming  
✅ **Safer code** - No null pointer exceptions  
✅ **Cleaner code** - Less clutter, more readable  
✅ **Type safe** - Works with TypeScript strictNullChecks  
✅ **Testable** - Predictable behavior for edge cases  

---

## Implementation Phases

1. **Week 1:** Create null object classes (8 entities)
2. **Week 2:** Update repository layer
3. **Week 3:** Update service layer
4. **Week 4:** Update route handlers
5. **Week 5:** Update transformers
6. **Week 6:** Update database helpers
7. **Week 7:** Comprehensive testing
8. **Week 8:** Documentation & migration

---

## Key Utilities

```typescript
// Check if object is null
NullObject.isNullObject(obj) // true/false

// Throw if null (for required resources)
throwIfNull(obj, 'Not found', 404)

// Check if present
if (isPresent(obj)) { /* use obj */ }

// Get with default
const value = getOrDefault(obj, defaultValue)
```

---

## Success Metrics

- **70%+ reduction** in null checks
- **30%+ reduction** in code complexity
- **Zero** null pointer errors
- **95%+** test coverage maintained

---

## See Also

- [Full Implementation Plan](./NULL_OBJECT_PATTERN_IMPLEMENTATION.md)
- [TypeScript Migration Progress](./TYPESCRIPT_MIGRATION_PROGRESS.md)
- [Strictness Improvements](./TYPESCRIPT_STRICTNESS_IMPROVEMENTS.md)
