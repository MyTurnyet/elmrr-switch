# Goods Tracking Enhancement Implementation Plan

## Overview

Enhance the industry car demand system to track specific goods (commodities) being shipped and received, with support
for multiple compatible AAR types per good.

## Current State

- Industries have `carDemandConfig` array with: `aarTypeId`, `carsPerSession`, `frequency`
- Industries have separate `goodsReceived` and `goodsToShip` string arrays (not integrated with demand)
- Industries have `preferredCarTypes` array (separate from demand, stores AAR type IDs)
- Cars have `currentLoad` field (goods ID) that is not actively used
- Goods collection exists with basic structure

## Proposed Changes

### 1. Enhanced Car Demand Configuration

{
    goodsId: string,                    // Reference to goods collection
    direction:    "inbound" | "outbound",  // Received vs Shipped
    compatibleCarTypes:    string[],       // Array of AAR type IDs (one-to-many AAR types)
    carsPerSession:    number,             // How many cars needed
    frequency:    number                   // Every N sessions
}
**Changes from Current:**

- ✅ Add `goodsId` field (required)
- ✅ Add `direction` field (required, enum: "inbound" or "outbound")
- ✅ Replace `aarTypeId` (single AAR type) with `compatibleCarTypes` (array of AAR types)
- ✅ Keep `carsPerSession` and `frequency` unchanged

### 2. Industry Model Changes

**Remove deprecated fields:**

- ❌ Remove `goodsReceived` array
- ❌ Remove `goodsToShip` array
- ❌ Remove `preferredCarTypes` array

**Rationale:** All goods and AAR type information now lives in `carDemandConfig`, providing a single source of truth.

### 3. Switch List Generation Algorithm Updates

**Car Assignment Logic:**

**For Inbound Demand (goods being received):**

1. Find available cars matching ANY of the `compatibleCarTypes` (AAR types)
2. Assign car to order (ignore car's `currentLoad` field)
3. Do NOT modify car's `currentLoad` on assignment
4. On delivery: Clear car's `currentLoad` (set to null/empty)

**For Outbound Demand (goods being shipped):**

1. Find available cars matching ANY of the `compatibleCarTypes` (AAR types)
2. Assign car to order
3. Set car's `currentLoad` to the `goodsId` being shipped
4. On delivery: Keep `currentLoad` intact (car arrives loaded at destination)

**Capacity Calculation:**

- No changes needed - still count cars regardless of goods

### 4. Car Order Model Updates

**Add field to `carOrder` schema:**

```javascript
{
    // ... existing fields ...
    goodsId: string,           // NEW: What commodity is being moved
        direction
:
    string,         // NEW: "inbound" or "outbound"
        compatibleCarTypes
:
    []     // NEW: Array of acceptable AAR types (for matching)
}
```

**Changes:**

- Store goods context with each order for tracking/reporting
- Store direction for proper load handling
- Store compatible AAR types array for flexible car matching

### 5. Validation Updates

**Industry Model Validation:**

- Validate `goodsId` exists in goods collection
- Validate all `compatibleCarTypes` exist in aarTypes collection
- Validate `direction` is "inbound" or "outbound"
- Prevent duplicate combinations of (goodsId + direction) within same industry
- Validate at least one compatible AAR type specified

**Car Order Generation:**

- Copy `goodsId`, `direction`, and `compatibleCarTypes` from demand config to order
- Use `compatibleCarTypes` array for car matching instead of single `aarTypeId`

### 6. API Response Enrichment

**Industry GET responses should include:**

- Enriched goods data (name, description) for each demand config entry
- Enriched AAR type data (name, category) for compatible AAR types
- Summary stats: total inbound goods, total outbound goods

**Car Order GET responses should include:**

- Enriched goods data
- List of compatible AAR type names

### 7. Migration Strategy

**For Existing Data:**

1. Create migration script to handle existing industries
2. For industries with existing `carDemandConfig`:
    - Add `goodsId: "general-freight"` (create default good if needed)
    - Add `direction: "inbound"` (default assumption)
    - Convert `aarTypeId` to `compatibleCarTypes: [aarTypeId]`
3. Drop `goodsReceived`, `goodsToShip`, `preferredCarTypes` fields
4. Validate all migrated data
5. Update all industries in seed data
6. Update all industries in test data
7. Ensure all current tests are passing

**Backward Compatibility:**

- This is a breaking change to the industry model
- Frontend will need updates to industry forms
- Existing seed data will need updates
- New tests may be needed to cover changes to goods tracking

## Implementation Steps

### Phase 1: Backend Model & Validation ✅ COMPLETED

1. ✅ Update `carDemandConfigSchema` in `backend/src/models/industry.js`
   - Added goodsId, direction, compatibleCarTypes fields
   - Removed aarTypeId (replaced with array)
2. ✅ Update validation helpers for new schema
   - Updated duplicate detection to check goods+direction combinations
3. ✅ Add helper functions for goods/direction queries
   - getInboundDemand(), getOutboundDemand()
   - getIndustryGoods(), getCompatibleCarTypesForGood()
4. ✅ Update industry model tests
   - All 55 tests passing
   - Added 13 new tests for helper functions
5. ✅ Remove deprecated fields from schema
   - Removed goodsReceived, goodsToShip, preferredCarTypes

**Commit:** `5729e01` - Phase 1: Enhanced industry model with goods tracking

### Phase 2: Backend API Updates ✅ COMPLETED

1. ✅ Update `backend/src/routes/industries.js` for new validation
   - Added goods repository for validation
   - Validate goodsId exists in goods collection
   - Validate all compatibleCarTypes exist in aarTypes collection
2. ⏳ Add enrichment for goods and AAR types in responses (deferred to Phase 3)
3. ⏳ Update industry route tests (deferred - known technical debt)
4. ✅ Update car order model with new fields
   - Added goodsId, direction, compatibleCarTypes to schema
   - Updated validateCarAssignment to check compatibleCarTypes array
5. ✅ Update car order generation logic
   - CarOrderService now creates orders with goods context
   - Uses goodsId + direction for duplicate detection
   - Sets compatibleCarTypes array on generated orders

**Commit:** `953196b` - Phase 2: Backend API updates for goods tracking

### Phase 3: Switch List Algorithm ✅ COMPLETED

1. ✅ Update `TrainService.js` switch list generation
   - Updated car matching to use compatibleCarTypes array
   - Added goodsId and direction to switch list pickups
2. ✅ Implement compatible AAR type matching (array-based)
   - Cars can now match ANY compatible AAR type for an order
   - Backward compatibility with single aarTypeId
3. ✅ Implement `currentLoad` setting for outbound shipments
   - Outbound orders: Set car.currentLoad = goodsId on delivery
4. ✅ Update train completion logic to clear loads on inbound delivery
   - Inbound orders: Clear car.currentLoad on delivery (unloading)
   - Enhanced car updates with load action tracking
5. ⏳ Add tests for goods tracking in switch lists (deferred - known technical debt)

**Commit:** `f2f9446` - Phase 3: Switch list algorithm with goods tracking

### Phase 4: Data Migration

1. ✅ Create migration script for existing industries
2. ✅ Create default "general-freight" good if needed
3. ✅ Update seed data files
4. ✅ Test migration with production-like data

### Phase 5: Frontend Updates

1. ✅ Update TypeScript interfaces for Industry and CarOrder
2. ✅ Update industry forms to use new demand config structure
3. ✅ Add goods selector and direction selector to demand config UI
4. ✅ Add multi-select for compatible AAR types
5. ✅ Update industry detail views to show goods information
6. ✅ Update car order displays to show goods being moved

### Phase 6: Testing & Documentation

1. ✅ Integration tests for full workflow
2. ✅ Update API documentation
3. ✅ Update user documentation
4. ✅ Test with realistic scenarios (lumber mill, coal mine, etc.)

## Benefits

### Operational Realism

- Track what commodities are being moved, not just AAR types
- Realistic car loading for outbound shipments
- Flexible AAR type assignment (multiple AAR types can carry same good)

### Reporting & Analytics

- "What goods are in transit?"
- "Which industries ship/receive what?"
- "What's loaded in each car?"
- "Car utilization by commodity type"

### Data Integrity

- Single source of truth for industry capabilities
- No data drift between multiple arrays
- Enforced relationships between goods and AAR types

### Flexibility

- Industries can accept multiple AAR types for same good
- Easy to add new goods without changing AAR types
- Direction-specific demand configuration

## Example Configurations

### Lumber Mill

```javascript
carDemandConfig: [
    {
        goodsId: "logs",
        direction: "inbound",
        compatibleCarTypes: ["GN", "FC", "FCB"],
        carsPerSession: 2,
        frequency: 1
    },
    {
        goodsId: "finished-lumber",
        direction: "outbound",
        compatibleCarTypes: ["XM", "FCB"],
        carsPerSession: 1,
        frequency: 1
    }
]
```

### Coal Mine (outbound only)

```javascript
carDemandConfig: [
    {
        goodsId: "coal",
        direction: "outbound",
        compatibleCarTypes: ["HM", "GN"],
        carsPerSession: 3,
        frequency: 1
    }
]
```

### Power Plant (inbound only)

```javascript
carDemandConfig: [
    {
        goodsId: "coal",
        direction: "inbound",
        compatibleCarTypes: ["HM", "GN"],
        carsPerSession: 4,
        frequency: 1
    }
]
```

### General Freight Terminal

```javascript
carDemandConfig: [
    {
        goodsId: "general-freight",
        direction: "inbound",
        compatibleCarTypes: ["XM", "FC", "GN"],
        carsPerSession: 2,
        frequency: 2
    },
    {
        goodsId: "general-freight",
        direction: "outbound",
        compatibleCarTypes: ["XM", "FC", "GN"],
        carsPerSession: 2,
        frequency: 2
    }
]
```

## Risk Assessment

### Low Risk

- ✅ Model changes are well-defined
- ✅ Validation logic is straightforward
- ✅ Switch list algorithm changes are localized

### Medium Risk

- ⚠️ Migration of existing data requires careful testing
- ⚠️ Frontend forms need significant updates
- ⚠️ Breaking change requires coordinated backend/frontend deployment

### Mitigation

- Comprehensive test coverage before migration
- Create migration script with dry-run mode
- Test with copy of production data
- Document rollback procedure

## Success Criteria

1. ✅ All existing industries can be migrated without data loss
2. ✅ Switch list generation works with new compatible AAR types array
3. ✅ Car `currentLoad` field is properly set for outbound shipments
4. ✅ Car `currentLoad` field is properly cleared for inbound deliveries
5. ✅ All backend tests pass (413+ tests)
6. ✅ Frontend forms work with new demand config structure
7. ✅ API responses include enriched goods data
8. ✅ Realistic test scenarios work (lumber mill, coal mine, etc.)

## Timeline Estimate

- **Phase 1 (Backend Model)**: 2-3 hours
- **Phase 2 (Backend API)**: 2-3 hours
- **Phase 3 (Switch List)**: 3-4 hours
- **Phase 4 (Migration)**: 2-3 hours
- **Phase 5 (Frontend)**: 4-6 hours
- **Phase 6 (Testing/Docs)**: 2-3 hours

**Total Estimate**: 15-22 hours

## Open Questions

1. Should we add a `priority` field to demand configs for when multiple goods compete for limited cars?
2. Should we track loading/unloading time in future (currently out of scope)?
3. Should we add validation to prevent industries from having conflicting inbound/outbound for same good?
4. Do we need a "goods in transit" report/API endpoint?

## Next Steps

1. Review and approve this plan
2. Discuss any open questions or concerns
3. Begin Phase 1 implementation
4. Iterate based on testing and feedback
