# Data Format Issues and Fix Steps

## Issues Identified

After analyzing the import route and validation schemas, the current `data/seed/seed-data.json` file has several critical issues that will prevent successful import:

### Issue 1: Industries Missing Required Field
**Problem**: Industries use `stationName` but the schema requires `stationId`
- **Current**: `"stationName": "Vancouver, BC"`
- **Expected**: `"stationId": "<station-id-reference>"`

**Impact**: All 29 industries will fail validation

### Issue 2: Cars Missing Required Field
**Problem**: Cars use `aarType` but the schema requires `carType`
- **Current**: `"aarType": "FB"`
- **Expected**: `"carType": "FB"` (or reference to AAR type)

**Impact**: All 20 cars will fail validation

### Issue 3: Station Field Name Mismatch
**Problem**: Stations use `stationName` but may need to match expected schema
- **Current**: `"stationName": "Edmonton, AB"`
- **Potential issue**: May need `name` field instead

### Issue 4: Missing Relationships
**Problem**: The import expects ID references, but we're using names
- Industries need `stationId` (reference to station)
- Cars need `homeYard` and `currentIndustry` (references to industry IDs or names)

**Note**: The import route doesn't validate stations, but there's no station validation schema found.

## Fix Steps

### Step 1: Determine Station Import Strategy
**Decision needed**: Does the station import:
1. Auto-generate IDs that can be referenced?
2. Require a two-pass import (stations first, then get IDs for industries)?
3. Support name-based lookups?

**Action**: Check if there's a station validation schema or if stations are imported as-is

### Step 2: Fix Industry Schema Violations
**Change required**:
```json
// FROM:
{
  "name": "Vancouver Yard",
  "stationName": "Vancouver, BC",  // ❌ Wrong field
  ...
}

// TO:
{
  "name": "Vancouver Yard",
  "stationId": "<station-id-or-name>",  // ✅ Correct field
  ...
}
```

**Impact**: 29 industries need this change

### Step 3: Fix Car Schema Violations
**Change required**:
```json
// FROM:
{
  "reportingMarks": "GSVR",
  "reportingNumber": "459003",
  "aarType": "FB",  // ❌ Wrong field
  ...
}

// TO:
{
  "reportingMarks": "GSVR",
  "reportingNumber": "459003",
  "carType": "FB",  // ✅ Correct field
  ...
}
```

**Impact**: 20 cars need this change

### Step 4: Resolve ID Reference Strategy
**Options**:
1. **Import stations first, then query to get IDs**: Most reliable but complex
2. **Use station names as IDs**: Simple but may not match backend expectations
3. **Create a preprocessing step**: Transform names to IDs before import

**Recommended**: Option 2 (use names) if the backend supports lookup by name, otherwise Option 1

### Step 5: Add Missing AAR Types (if needed)
The cars reference AAR types (FB, FBC, GHC, etc.) that may not exist in the database.

**Check**: Does the system need AAR types pre-loaded?
**Action**: May need to add an `aarTypes` array to seed file

## Implementation Order

1. ✅ **Fix field names**: `stationName` → `stationId`, `aarType` → `carType`
2. ⏳ **Clarify station ID strategy**: How do industries reference stations?
3. ⏳ **Test with minimal dataset**: Import 1 station, 1 industry, 1 car
4. ⏳ **Expand to full dataset**: Once format is validated

## Backend Analysis Results

After reviewing the backend code, here's what I found:

### Key Findings:

1. **IDs are NeDB Auto-Generated**: NeDB automatically creates `_id` fields when inserting records
2. **ID References Use _id Format**: All lookups use the auto-generated `_id` (e.g., cars.js line 149, 158)
3. **No Name-Based Lookups**: The system uses ID references, not name lookups
4. **Stations Have Indexes**: `stations` collection is indexed on `name` and `block` (database/index.js line 39-40)
5. **Test Data Shows Pattern**: Test data uses simple string IDs like `'station1'`, `'yard1'`, `'industry1'`

### Critical Discovery:
The import route (import.js line 88-101) imports stations WITHOUT validation, meaning they can have any structure!

## Recommended Approach: **Two-Pass Import with Simple IDs**

Use **simple string IDs** instead of auto-generated MongoDB ObjectIds:

### Strategy:
1. **Stations**: Add a simple `_id` field (e.g., `"vancouver-yard"`)
2. **Industries**: Reference station IDs in `stationId` field
3. **Cars**: Reference industry IDs in `homeYard` and `currentIndustry`

This matches the test data pattern and avoids the complexity of NeDB's auto-generated IDs.

## Updated Fix Steps

### Step 1: Fix Station Format
Add an `_id` field to each station using a simple, readable format:

```json
{
  "_id": "vancouver-yard",
  "stationName": "Vancouver Yard",
  "block": "NORTH",
  "type": "yard",
  "description": "Vancouver classification yard"
}
```

**Pattern**: Use lowercase with hyphens (e.g., `"seattle-wa"`, `"chicago-yard"`)

### Step 2: Fix Industry Format
Change `stationName` to `stationId` and reference station `_id`:

```json
{
  "name": "Vancouver Yard",
  "stationId": "vancouver-yard",  // ✅ References station _id
  "goodsReceived": [],
  "goodsToShip": [],
  "preferredCarTypes": ["all"],
  "isYard": true,
  "isOnLayout": true
}
```

Also add `_id` to industries for car references:
```json
{
  "_id": "vancouver-yard-industry",
  "name": "Vancouver Yard",
  "stationId": "vancouver-yard",
  ...
}
```

### Step 3: Fix Car Format
Change `aarType` to `carType` and ensure industry references match:

```json
{
  "reportingMarks": "CP",
  "reportingNumber": "317642",
  "carType": "FB",  // ✅ Changed from aarType
  "description": "Flatcar BlhHd",
  "color": "RED",
  "homeYard": "vancouver-yard-industry",  // ✅ References industry _id
  "currentIndustry": "vancouver-yard-industry",  // ✅ References industry _id
  "isInService": true
}
```

### Step 4: Import Order
The import route processes in this order:
1. Cars (with validation)
2. Industries (with validation)
3. Stations (no validation)

**Problem**: This means cars and industries will fail if stations don't exist yet!

**Solution**: Reorder the import route OR split into two imports:
- Import 1: Stations only
- Import 2: Industries + Cars

## Estimated Changes

- **Stations**: 13 records × add `_id` field = 13 new lines
- **Industries**: 29 records × change field + add `_id` = 58 lines
- **Cars**: 20 records × change field = 20 lines
- **Total**: ~91 line changes

## Next Steps

**Option A - Manual Fix** (Recommended for learning):
1. I can fix the seed-data.json file with the correct format
2. You run the import and we verify it works

**Option B - Import Route Enhancement**:
1. Modify the import route to process stations first
2. This would require backend code changes

Which approach would you prefer?