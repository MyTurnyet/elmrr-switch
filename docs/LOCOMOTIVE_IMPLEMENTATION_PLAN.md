# Locomotive Management Implementation Plan

## Overview

This document outlines the steps needed to implement full CRUD functionality for locomotive management in the elmrr-switch application. The implementation follows enterprise-level architectural patterns established during the backend refactoring.

## Current State Analysis

### ✅ What Exists
- Database collection (`locomotives.db`)
- Repository pattern (`LocomotiveRepository.js`)
- Basic routes (GET only - list and by ID)
- Null object pattern support (`NullLocomotive.js`)
- Database indexes (reportingMarks, reportingNumber, homeYard, dccAddress)
- Transformer infrastructure (`LocomotiveTransformer.js`)

### ❌ What's Missing
- **No locomotive model/validation schema** (critical gap)
- **No POST/PUT/DELETE endpoints** (can't create/update/delete)
- **No seed data** for locomotives
- **No comprehensive tests** for locomotive operations
- **Incomplete transformer** implementation

## Architecture Patterns

The implementation will follow these established patterns:
- **Repository Pattern** for data access abstraction
- **Service Layer** for complex business logic
- **Validation Middleware** with Joi schemas
- **Transformer Pattern** for consistent API responses
- **Null Object Pattern** for safe data handling
- **Comprehensive Testing** (model + route tests)

## Implementation Steps

### Step 1: Create Locomotive Model ✅ COMPLETED

**File:** `/backend/src/models/locomotive.js` (119 lines)

**Status:** ✅ Implemented and tested

**What Was Implemented:**
- ✅ Joi validation schema with all required fields
- ✅ Fields implemented:
  - `_id` (optional, for seed data support)
  - `reportingMarks` (string, required, 1-10 chars)
  - `reportingNumber` (string, required, exactly 6 chars)
  - `model` (string, required, 1-50 chars)
  - `isDCC` (boolean, default true)
  - `dccAddress` (number, required if `isDCC`, range 1-9999, default 3)
  - `manufacturer` (string, required, validated against approved list)
  - `homeYard` (string, required, industry/yard ID)
  - `isInService` (boolean, default true)
  - `notes` (string, optional, max 500 chars, default '')
- ✅ Export `validateLocomotive(data, isUpdate)` function
- ✅ Helper functions implemented:
  - `validateLocomotiveUniqueness(locomotives, reportingMarks, reportingNumber, excludeId)`
  - `validateDccAddressUniqueness(locomotives, dccAddress, excludeId)`
  - `formatLocomotiveSummary(locomotive)`
  - `formatDccAddress(dccAddress)` - Formats with leading zeros
  - `getValidManufacturers()` - Returns approved manufacturer list

**Validation Rules Implemented:**
- ✅ Reporting marks + number combination uniqueness checking
- ✅ DCC address uniqueness checking (when isDCC=true)
- ✅ Manufacturer validated against list: Atlas, Kato, Lionel, Bachmann, Athearn, Walthers, Broadway Limited, MTH, Rapido
- ✅ Reporting number exactly 6 characters
- ✅ DCC address range 1-9999 (1-4 digits)
- ✅ Conditional validation (dccAddress required only when isDCC=true)

**Tests:** `/backend/src/tests/models/locomotive.model.test.js` (402 lines)
- ✅ 44 comprehensive tests - all passing
- ✅ Coverage: required fields, constraints, DCC config, uniqueness, formatting, update mode

**Commit:** `8ef0085` - feat(locomotive): implement locomotive model with comprehensive validation

---

### Step 2: Verify/Enhance LocomotiveTransformer

**File:** `/backend/src/transformers/LocomotiveTransformer.js`

**Requirements:**
- Verify existing implementation has:
  - `transformCollection(locomotives, options)` - Transform array of locomotives
  - `transformForDetail(locomotive)` - Transform single locomotive with enriched data
  - `buildFilterQuery(queryParams)` - Build database query from request params
  - `transformPaginated(locomotives, pagination, options)` - Add pagination metadata
- Add missing methods if needed
- Support filtering by:
  - `isInService` (boolean)
  - `model` (string)
  - `homeYard` (string)
  - `manufacturer` (string)
  - `search` (reportingMarks or reportingNumber)

**Pattern Reference:** `CarTransformer.js`

---

### Step 3: Enhance LocomotiveRepository

**File:** `/backend/src/repositories/LocomotiveRepository.js`

**Requirements:**
- Add `validate(locomotive)` method:
  - Check reporting marks/number uniqueness
  - Check DCC address uniqueness (if isDCC=true)
  - Verify home yard exists and is on layout
  - Validate manufacturer is in approved list (Atlas, Kato, Lionel, etc.)
- Add `enrich(locomotive)` method:
  - Load home yard details
  - Add formatted display name (e.g., "ELMR 003801")
  - Format DCC address with leading zeros for display
- Add specialized query methods:
  - `findAvailable()` - Find in-service locomotives not assigned to active trains
  - `findByManufacturer(manufacturer, options)`
  - `findByModel(model, options)`
  - `checkTrainAssignments(locomotiveId)` - Check if assigned to any active trains
- Add statistics methods:
  - `getStatistics()` - Count by manufacturer, service status, etc.

**Pattern Reference:** `TrainRepository.js` (enrichment pattern)

**Business Rules:**
- Cannot delete locomotive if assigned to active train (status: Planned or In Progress)
- Cannot set isInService=false if assigned to active train
- Reporting marks + number must be unique across all locomotives
- DCC address must be unique across all locomotives (if isDCC=true)
- Reporting number must be exactly 6 characters
- DCC address must be 2-4 digits

---

### Step 4: Implement Full CRUD API

**File:** `/backend/src/routes/locomotives.js`

**Requirements:**

#### GET /api/locomotives
- List all locomotives with filtering
- Support query parameters:
  - `isInService` (boolean)
  - `manufacturer` (string)
  - `model` (string)
  - `homeYard` (string)
  - `search` (reportingMarks or reportingNumber)
  - `page`, `limit` (pagination)
  - `view` (default, summary, detail)
- Return transformed collection

#### GET /api/locomotives/:id
- Get single locomotive by ID
- Return enriched data (home yard details, formatted DCC address)
- Return 404 if not found (use null object pattern)

#### POST /api/locomotives
- Create new locomotive
- Validate with Joi schema
- Check for duplicate reporting marks/number
- Check for duplicate DCC address (if isDCC=true)
- Verify home yard exists and is on layout
- Validate reporting number is exactly 6 characters
- Return 201 with created locomotive
- Return 400 for validation errors
- Return 409 for duplicate conflicts

#### PUT /api/locomotives/:id
- Update existing locomotive
- Allow partial updates
- Validate changes with Joi schema
- Check for duplicate reporting marks/number (excluding current)
- Check for duplicate DCC address (excluding current, if isDCC=true)
- Verify home yard exists if changed
- Prevent isInService=false if assigned to active train
- Validate reporting number is exactly 6 characters if changed
- Return 200 with updated locomotive
- Return 404 if not found
- Return 400 for validation errors
- Return 409 for conflicts

#### DELETE /api/locomotives/:id
- Delete locomotive
- Check if assigned to any active trains
- Return 400 if assigned to active train (cannot delete)
- Return 204 on successful deletion
- Return 404 if not found

**Pattern Reference:** `cars.js` (130 lines, comprehensive CRUD)

**Error Handling:**
- Use `asyncHandler` for async route handlers
- Use `ApiError` for consistent error responses
- Use `ApiResponse.success()` for successful responses
- Use `throwIfNull()` for null object checking

---

### Step 5: Create Model Tests

**File:** `/backend/src/tests/models/locomotive.model.test.js`

**Requirements:**

#### Schema Validation Tests (15-20 tests)
- Valid locomotive data passes validation
- Required fields are enforced
- Optional fields work correctly
- String length constraints are enforced (reportingNumber exactly 6 chars)
- Boolean defaults work correctly (isDCC defaults to true)
- DCC address required when isDCC=true
- DCC address validation (2-4 digits)
- Invalid data types are rejected
- Edge cases (empty strings, null values, etc.)

#### Helper Function Tests (10-15 tests)
- `validateLocomotiveUniqueness()`:
  - Detects duplicate reporting marks/number
  - Allows same locomotive on update (excludeId)
  - Returns correct validation results
- `formatLocomotiveSummary()`:
  - Formats locomotive data correctly
  - Handles missing optional fields

#### Business Logic Tests (5-10 tests)
- Manufacturer validation (Atlas, Kato, Lionel, etc.)
- Home yard reference validation
- DCC address uniqueness validation
- Reporting number length validation (exactly 6 chars)
- Service status logic

**Target:** 30-40 tests total

**Pattern Reference:** `train.model.test.js` (49 tests)

**Test Structure:**
```javascript
describe('Locomotive Model', () => {
  describe('Schema Validation', () => {
    // Validation tests
  });
  
  describe('Helper Functions', () => {
    // Helper function tests
  });
  
  describe('Business Logic', () => {
    // Business rule tests
  });
});
```

---

### Step 6: Create Route Tests

**File:** `/backend/src/tests/routes/locomotives.routes.test.js`

**Requirements:**

#### GET /api/locomotives Tests (8-10 tests)
- Returns all locomotives
- Filters by isInService
- Filters by manufacturer
- Filters by model
- Filters by homeYard
- Search by reporting marks/number
- Pagination works correctly
- Returns empty array when no locomotives

#### GET /api/locomotives/:id Tests (3-5 tests)
- Returns locomotive by ID
- Returns enriched data
- Returns 404 for non-existent ID
- Returns 400 for invalid ID format

#### POST /api/locomotives Tests (8-10 tests)
- Creates valid locomotive
- Returns 201 status
- Validates required fields
- Returns 400 for missing fields
- Returns 400 for invalid data types
- Returns 400 for invalid reportingNumber length (not 6 chars)
- Returns 409 for duplicate reporting marks/number
- Returns 409 for duplicate DCC address
- Returns 400 for non-existent home yard
- Sets default values correctly (isDCC=true, dccAddress=3)

#### PUT /api/locomotives/:id Tests (10-12 tests)
- Updates locomotive successfully
- Allows partial updates
- Validates updated fields
- Returns 404 for non-existent ID
- Returns 400 for validation errors
- Returns 400 for invalid reportingNumber length
- Returns 409 for duplicate reporting marks/number
- Returns 409 for duplicate DCC address
- Prevents isInService=false if assigned to active train
- Updates homeYard successfully
- Handles edge cases

#### DELETE /api/locomotives/:id Tests (5-7 tests)
- Deletes locomotive successfully
- Returns 204 status
- Returns 404 for non-existent ID
- Returns 400 if assigned to active train
- Prevents deletion of in-use locomotives

**Target:** 35-45 tests total

**Pattern Reference:** `trains.routes.test.js` (42 tests)

**Mock Strategy:**
- Mock `getRepository()` for repository access
- Mock `dbHelpers` for database operations
- Mock train repository for assignment checks
- Use `jest.fn()` for function mocking

---

### Step 7: Create Seed Data

**File:** `/data/locomotives.json`

**Requirements:**
- Create 5-7 sample locomotives
- Include variety of:
  - Manufacturers (Atlas, Kato, Lionel, Bachmann, etc.)
  - Models (GP38-2, SD40-2, GP9, SW1500, etc.)
  - DCC configurations (some DCC, some DC)
  - Service status (some in service, some not)
  - Different home yards
- Use realistic railroad reporting marks
- Reporting numbers must be exactly 6 characters
- Include descriptive notes

**Example Structure:**
```json
[
  {
    "_id": "loco-gp38-001",
    "reportingMarks": "ELMR",
    "reportingNumber": "003801",
    "model": "GP38-2",
    "manufacturer": "Atlas",
    "isDCC": true,
    "dccAddress": 3801,
    "homeYard": "yard-001",
    "isInService": true,
    "notes": "Primary road switcher for mainline operations"
  },
  {
    "_id": "loco-sd40-001",
    "reportingMarks": "ELMR",
    "reportingNumber": "004001",
    "model": "SD40-2",
    "manufacturer": "Kato",
    "isDCC": true,
    "dccAddress": 4001,
    "homeYard": "yard-001",
    "isInService": true,
    "notes": "Heavy haul locomotive for coal trains"
  },
  {
    "_id": "loco-gp9-001",
    "reportingMarks": "ELMR",
    "reportingNumber": "000901",
    "model": "GP9",
    "manufacturer": "Bachmann",
    "isDCC": false,
    "homeYard": "yard-002",
    "isInService": false,
    "notes": "Awaiting maintenance - bad traction motor"
  }
]
```

**Integration:**
- Update `/data/seed/seed-data.json` to include locomotives array
- Ensure home yard IDs reference existing yard industries in seed data
- Ensure all reporting numbers are exactly 6 characters
- Ensure DCC addresses are unique
- Coordinate with existing seed script

---

### Step 8: Update Import/Export Routes

**File:** `/backend/src/routes/import.js`

**Requirements:**

#### Export Functionality
- Add locomotives to export data structure
- Include in `/api/import/export` endpoint
- Format: `{ locomotives: [...], cars: [...], ... }`

#### Import Functionality
- Add locomotive validation to import process
- Validate locomotive data with `validateLocomotive()`
- Check for duplicate reporting marks/number
- Verify industry references exist
- Include in `/api/import` endpoint

#### Clear Functionality
- Add locomotives to clear operation
- Include in `/api/import/clear` endpoint
- Clear locomotives collection when clearing all data

**Pattern Reference:** Existing collection handling in `import.js`

**Code Locations:**
- Export: Add to data collection around line 50-100
- Import: Add validation around line 150-200
- Clear: Add to collection clearing around line 250-300

---

### Step 9: Validation & Testing

**Requirements:**

#### Run Test Suite
```bash
cd backend
npm test
```

**Expected Results:**
- All existing tests continue to pass
- New locomotive model tests pass (30-40 tests)
- New locomotive route tests pass (35-45 tests)
- Total test count increases by 65-85 tests

#### Manual API Testing
Test each endpoint manually or with Postman/curl:

**Create Locomotive:**
```bash
curl -X POST http://localhost:3001/api/locomotives \
  -H "Content-Type: application/json" \
  -d '{
    "reportingMarks": "ELMR",
    "reportingNumber": "003801",
    "model": "GP38-2",
    "manufacturer": "Atlas",
    "isDCC": true,
    "dccAddress": 3801,
    "homeYard": "yard-001",
    "isInService": true,
    "notes": "Test locomotive"
  }'
```

**List Locomotives:**
```bash
curl http://localhost:3001/api/locomotives
```

**Get Locomotive:**
```bash
curl http://localhost:3001/api/locomotives/{id}
```

**Update Locomotive:**
```bash
curl -X PUT http://localhost:3001/api/locomotives/{id} \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated notes"}'
```

**Delete Locomotive:**
```bash
curl -X DELETE http://localhost:3001/api/locomotives/{id}
```

#### Integration Testing
- Create a locomotive via API
- Create a train and assign the locomotive
- Verify cannot delete locomotive while assigned to active train
- Complete the train
- Verify can now delete the locomotive
- Test import/export includes locomotives
- Verify seed data loads correctly

#### Validation Checklist
- [ ] All model tests pass
- [ ] All route tests pass
- [ ] Can create locomotives via API
- [ ] Can update locomotives via API
- [ ] Can delete locomotives via API
- [ ] Cannot delete locomotive assigned to active train
- [ ] Duplicate reporting marks/number prevented
- [ ] Invalid home yard references rejected
- [ ] Duplicate DCC addresses prevented
- [ ] Reporting number length validated (exactly 6 chars)
- [ ] Seed data loads successfully
- [ ] Import/export includes locomotives
- [ ] Train creation works with available locomotives

---

## Key Quality Practices

### ✅ Separation of Concerns
- **Model Layer:** Validation schemas and business rules
- **Repository Layer:** Data access and enrichment
- **Route Layer:** HTTP handling and response formatting
- **Service Layer:** Complex business logic (if needed)

### ✅ Validation First
- Joi schemas catch errors early
- Validate at model level before database operations
- Return clear, actionable error messages

### ✅ Business Rules
- Prevent locomotive conflicts (can't delete if assigned to active train)
- Enforce reporting marks/number uniqueness
- Enforce DCC address uniqueness (when isDCC=true)
- Validate home yard references exist and are on layout
- Enforce reporting number length (exactly 6 characters)
- Prevent taking out of service if assigned to active train

### ✅ Comprehensive Testing
- Model tests cover validation and helpers
- Route tests cover all endpoints and error cases
- Target: 65-85 total tests
- Use mocking for dependencies
- Test edge cases and error conditions

### ✅ Consistent Patterns
- Follow existing car/train implementations
- Use established repository pattern
- Use transformer pattern for API responses
- Use null object pattern for safe data handling

### ✅ Error Handling
- Use `ApiError` with proper status codes
- Return consistent error response format
- Provide helpful error messages
- Handle all error cases (404, 400, 409, 500)

### ✅ Null Safety
- Use null object pattern from existing implementation
- Use `throwIfNull()` helper for consistent null checking
- Return appropriate 404 responses

---

## Estimated Effort

| Task | Estimated Time |
|------|----------------|
| Model + Validation | ~30 minutes |
| Repository Enhancement | ~20 minutes |
| API Endpoints | ~45 minutes |
| Model Tests | ~40 minutes |
| Route Tests | ~50 minutes |
| Seed Data | ~15 minutes |
| Import/Export | ~20 minutes |
| Testing/Validation | ~30 minutes |
| **Total** | **~4 hours** |

This estimate assumes familiarity with the codebase and established patterns.

---

## Success Criteria

### Functional Requirements
- ✅ Can create locomotives via API
- ✅ Can read locomotives (list and by ID)
- ✅ Can update locomotives via API
- ✅ Can delete locomotives via API (with business rule enforcement)
- ✅ Locomotives can be assigned to trains
- ✅ Cannot delete locomotives assigned to active trains
- ✅ Seed data includes sample locomotives
- ✅ Import/export includes locomotives

### Quality Requirements
- ✅ 65-85 new tests (model + route)
- ✅ All tests passing
- ✅ Follows established architectural patterns
- ✅ Comprehensive error handling
- ✅ Clear, actionable error messages
- ✅ Consistent API response format
- ✅ Proper validation at all layers

### Documentation Requirements
- ✅ Model documented with JSDoc comments
- ✅ API endpoints documented
- ✅ Business rules clearly stated
- ✅ Test coverage documented

---

## Dependencies

### Required Collections
- `locomotives` - Main locomotive collection (exists)
- `industries` - For homeYard validation (exists)
- `trains` - For assignment conflict checking (exists)

### Required Packages
- `joi` - Validation (already installed)
- `express` - Routing (already installed)
- `nedb` - Database (already installed)
- `jest` - Testing (already installed)

### Required Infrastructure
- Repository pattern (exists)
- Transformer pattern (exists)
- Null object pattern (exists)
- Error handling middleware (exists)
- API response utilities (exists)

---

## Risk Mitigation

### Potential Issues
1. **Locomotive assignment conflicts:** Mitigated by checking train assignments before deletion
2. **Duplicate reporting marks:** Mitigated by uniqueness validation
3. **Duplicate DCC addresses:** Mitigated by uniqueness validation
4. **Invalid home yard references:** Mitigated by reference validation
5. **Reporting number format issues:** Mitigated by strict 6-character validation
6. **Breaking existing train functionality:** Mitigated by comprehensive testing

### Testing Strategy
- Unit tests for model validation
- Integration tests for API endpoints
- Manual testing for train assignment workflow
- Regression testing for existing functionality

---

## Next Steps

After completing this implementation:
1. **Frontend Integration:** Create UI for locomotive management
2. **Advanced Features:** 
   - Locomotive maintenance tracking
   - Fuel consumption tracking
   - Assignment history
3. **Reporting:**
   - Locomotive utilization reports
   - Service status dashboards
4. **Performance:**
   - Add caching for frequently accessed locomotives
   - Optimize queries for large datasets

---

## References

### Code Examples
- **Model Pattern:** `/backend/src/models/car.js`
- **Repository Pattern:** `/backend/src/repositories/TrainRepository.js`
- **Route Pattern:** `/backend/src/routes/cars.js`
- **Model Tests:** `/backend/src/tests/models/train.model.test.js`
- **Route Tests:** `/backend/src/tests/routes/trains.routes.test.js`

### Documentation
- **Repository Pattern:** `/backend/docs/NULL_OBJECT_PATTERN_IMPLEMENTATION.md`
- **API Versioning:** `/backend/docs/API_VERSIONING.md`
- **Logging:** `/backend/docs/LOGGING.md`

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding full locomotive management functionality to the elmrr-switch application. By following established architectural patterns and maintaining high quality standards, the implementation will be robust, maintainable, and consistent with the existing codebase.

The plan prioritizes:
- **Quality over speed:** Comprehensive testing and validation
- **Consistency:** Following established patterns
- **Maintainability:** Clear separation of concerns
- **Safety:** Business rule enforcement and error handling

Ready to begin implementation with Step 1.
