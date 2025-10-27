# Request/Response Transformation Layer

## Overview

The transformation layer provides a consistent, maintainable way to transform data between database representation and API responses. It handles serialization, field filtering, pagination, and view-specific transformations.

## Architecture

### BaseTransformer

Abstract base class that provides common transformation functionality:

```javascript
import { BaseTransformer } from '../transformers/BaseTransformer.js';

class MyTransformer extends BaseTransformer {
  transform(entity, options = {}) {
    // Custom transformation logic
    return transformedEntity;
  }
}
```

### Entity-Specific Transformers

Each entity type has its own transformer (e.g., `CarTransformer`, `TrainTransformer`) that extends `BaseTransformer` and implements entity-specific logic.

### Transformer Factory

Centralized access to all transformers:

```javascript
import { getTransformer, transform, transformCollection } from '../transformers/index.js';

// Get a specific transformer
const carTransformer = getTransformer('car');

// Transform a single entity
const transformed = transform('car', carEntity);

// Transform a collection
const transformedList = transformCollection('car', carEntities);
```

## Features

### 1. View-Specific Transformations

Different views for different use cases:

#### List View (Minimal Fields)
```javascript
const cars = carTransformer.transformCollection(entities, { view: 'list' });
// Returns: [{ id, reportingMarks, reportingNumber, carType, currentIndustry, isInService }]
```

#### Detail View (All Fields + Computed)
```javascript
const car = carTransformer.transformForDetail(entity);
// Returns: { ...allFields, fullReportingMarks, status, metadata }
```

#### Export View (Flat Structure)
```javascript
const cars = carTransformer.transformCollection(entities, { view: 'export' });
// Returns: [{ "ID": "...", "Reporting Marks": "...", ... }]
```

### 2. Pagination Support

Built-in pagination with metadata:

```javascript
const pagination = parsePagination(req.query); // { page, limit, offset }

const result = carTransformer.transformPaginated(cars, {
  page: pagination.page,
  limit: pagination.limit,
  total: totalCount
});

// Returns:
// {
//   data: [...transformedEntities],
//   pagination: {
//     page: 1,
//     limit: 50,
//     total: 150,
//     totalPages: 3,
//     hasMore: true
//   }
// }
```

### 3. Field Filtering

Select or exclude specific fields:

```javascript
// Select specific fields
const selected = transformer.selectFields(entity, ['id', 'name', 'status']);

// Exclude specific fields
const filtered = transformer.excludeFields(entity, ['internalField', 'sensitiveData']);
```

### 4. Filter Query Building

Transform query parameters into database queries:

```javascript
const query = CarTransformer.buildFilterQuery(req.query);
// Input: { carType: 'boxcar', status: 'true', location: 'yard1' }
// Output: { carType: 'boxcar', isInService: true, currentIndustry: 'yard1' }
```

### 5. Sorting and Pagination Parsing

Parse query parameters:

```javascript
// Pagination
const { page, limit, offset } = parsePagination(req.query);

// Fields
const fields = parseFields(req.query.fields); // "id,name,status" → ['id', 'name', 'status']

// Sorting
const sort = parseSort(req.query.sort); // "-createdAt" → { field: 'createdAt', order: 'desc' }
```

## Usage in Routes

### Basic Usage

```javascript
import { CarTransformer, parsePagination } from '../transformers/index.js';

const carTransformer = new CarTransformer();

router.get('/', asyncHandler(async (req, res) => {
  // Build filter query
  const query = CarTransformer.buildFilterQuery(req.query);
  
  // Get data
  const cars = await dbHelpers.findByQuery('cars', query);
  
  // Transform
  const view = req.query.view || 'default';
  const transformed = carTransformer.transformCollection(cars, { view });
  
  res.json(ApiResponse.success(transformed));
}));
```

### With Pagination

```javascript
router.get('/', asyncHandler(async (req, res) => {
  const query = CarTransformer.buildFilterQuery(req.query);
  const pagination = parsePagination(req.query);
  
  const cars = await dbHelpers.findByQuery('cars', query);
  
  if (req.query.page) {
    const paginated = carTransformer.transformPaginated(cars, {
      ...pagination,
      total: cars.length
    });
    res.json(ApiResponse.success(paginated));
  } else {
    const transformed = carTransformer.transformCollection(cars);
    res.json(ApiResponse.success(transformed));
  }
}));
```

### Detail Endpoint

```javascript
router.get('/:id', asyncHandler(async (req, res) => {
  const car = await dbHelpers.findById('cars', req.params.id);
  
  if (!car) {
    throw new ApiError('Car not found', 404);
  }
  
  const transformed = carTransformer.transformForDetail(car);
  res.json(ApiResponse.success(transformed));
}));
```

## Creating a New Transformer

### Step 1: Create Transformer Class

```javascript
// src/transformers/TrainTransformer.js
import { BaseTransformer } from './BaseTransformer.js';

export class TrainTransformer extends BaseTransformer {
  transform(train, options = {}) {
    if (!train) return null;
    
    const sanitized = BaseTransformer.sanitize(train);
    
    return {
      id: sanitized._id,
      name: sanitized.name,
      status: sanitized.status,
      // ... other fields
    };
  }
  
  static buildFilterQuery(queryParams) {
    const query = {};
    
    if (queryParams.status) {
      query.status = queryParams.status;
    }
    
    // ... other filters
    
    return query;
  }
}
```

### Step 2: Register in Factory

```javascript
// src/transformers/index.js
import { TrainTransformer } from './TrainTransformer.js';

const transformers = {
  car: new CarTransformer(),
  train: new TrainTransformer(), // Add new transformer
  // ...
};
```

### Step 3: Use in Route

```javascript
import { TrainTransformer } from '../transformers/index.js';

const trainTransformer = new TrainTransformer();

router.get('/', asyncHandler(async (req, res) => {
  const query = TrainTransformer.buildFilterQuery(req.query);
  const trains = await dbHelpers.findByQuery('trains', query);
  const transformed = trainTransformer.transformCollection(trains);
  
  res.json(ApiResponse.success(transformed));
}));
```

## API Query Parameters

### Pagination

```
GET /api/v1/cars?page=2&limit=25
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "totalPages": 6,
    "hasMore": true
  }
}
```

### View Selection

```
GET /api/v1/cars?view=list        # Minimal fields
GET /api/v1/cars?view=detail      # All fields + computed
GET /api/v1/cars?view=export      # Export-friendly format
```

### Field Selection

```
GET /api/v1/cars?fields=id,reportingMarks,carType
```

### Sorting

```
GET /api/v1/cars?sort=reportingMarks    # Ascending
GET /api/v1/cars?sort=-createdAt        # Descending (prefix with -)
```

### Filtering

Entity-specific filters (defined in each transformer):

```
GET /api/v1/cars?carType=boxcar&status=true&location=yard1
```

## CarTransformer Example

### List View Response

```json
{
  "id": "car123",
  "reportingMarks": "ATSF",
  "reportingNumber": "12345",
  "carType": "boxcar",
  "currentIndustry": "lumber-mill",
  "isInService": true
}
```

### Detail View Response

```json
{
  "id": "car123",
  "reportingMarks": "ATSF",
  "reportingNumber": "12345",
  "carType": "boxcar",
  "currentIndustry": "lumber-mill",
  "homeYard": "main-yard",
  "isInService": true,
  "sessionsAtCurrentLocation": 3,
  "lastMoved": "2025-10-27T18:00:00.000Z",
  "fullReportingMarks": "ATSF 12345",
  "status": "In Service",
  "metadata": {
    "lastMoved": "2025-10-27T18:00:00.000Z",
    "sessionsAtLocation": 3
  }
}
```

### Export View Response

```json
{
  "ID": "car123",
  "Reporting Marks": "ATSF",
  "Reporting Number": "12345",
  "Car Type": "boxcar",
  "Current Location": "lumber-mill",
  "Home Yard": "main-yard",
  "In Service": "Yes",
  "Sessions at Location": 3,
  "Last Moved": "2025-10-27T18:00:00.000Z"
}
```

## Benefits

### 1. Consistency
- All API responses follow the same transformation patterns
- Consistent field naming and formatting
- Standardized pagination and filtering

### 2. Maintainability
- Transformation logic centralized in one place
- Easy to update response formats
- Clear separation of concerns

### 3. Flexibility
- Multiple views for different use cases
- Easy field selection and filtering
- Extensible for new requirements

### 4. Performance
- List views return minimal data
- Pagination reduces payload size
- Field selection reduces bandwidth

### 5. Testability
- Transformation logic can be unit tested
- Independent of route handlers
- Easy to mock in tests

## Best Practices

### 1. Keep Transformers Pure
Transformers should not have side effects or make database calls.

```javascript
// ❌ Bad
transform(entity) {
  const related = await db.findRelated(entity.id); // Don't do this
  return { ...entity, related };
}

// ✅ Good
transform(entity) {
  return {
    id: entity._id,
    name: entity.name
  };
}
```

### 2. Use Static Methods for Utilities
Query building and parsing should be static methods.

```javascript
static buildFilterQuery(queryParams) {
  // Build query object
}
```

### 3. Sanitize Internal Fields
Always remove database-internal fields.

```javascript
const sanitized = BaseTransformer.sanitize(entity);
// Removes $$indexCreated, $$indexRemoved, etc.
```

### 4. Provide Multiple Views
Implement list, detail, and export views for flexibility.

```javascript
_transformForList(entity) { /* minimal fields */ }
_transformForDetail(entity) { /* all fields */ }
_transformForExport(entity) { /* export format */ }
```

### 5. Document Transformations
Clearly document what each transformation does.

```javascript
/**
 * Transform car for list view (minimal fields for performance)
 * @private
 */
_transformForList(car) {
  // ...
}
```

## Testing Transformers

```javascript
import { CarTransformer } from '../transformers/CarTransformer.js';

describe('CarTransformer', () => {
  const transformer = new CarTransformer();
  
  it('should transform car for list view', () => {
    const car = {
      _id: 'car1',
      reportingMarks: 'ATSF',
      reportingNumber: '12345',
      carType: 'boxcar',
      // ... other fields
    };
    
    const transformed = transformer.transformForList(car);
    
    expect(transformed).toEqual({
      id: 'car1',
      reportingMarks: 'ATSF',
      reportingNumber: '12345',
      carType: 'boxcar',
      currentIndustry: expect.any(String),
      isInService: expect.any(Boolean)
    });
  });
  
  it('should build filter query', () => {
    const query = CarTransformer.buildFilterQuery({
      carType: 'boxcar',
      status: 'true'
    });
    
    expect(query).toEqual({
      carType: 'boxcar',
      isInService: true
    });
  });
});
```

## Future Enhancements

- [ ] GraphQL support
- [ ] JSON:API specification compliance
- [ ] HAL (Hypertext Application Language) support
- [ ] Automatic OpenAPI schema generation
- [ ] Response caching based on transformations
- [ ] Transformation performance metrics

---

**Last Updated:** October 27, 2025  
**Status:** In Development  
**Coverage:** Cars entity (others pending)
