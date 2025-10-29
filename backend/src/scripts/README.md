# Migration Scripts

This directory contains data migration scripts for the Elmrr Switch backend.

## Goods Tracking Enhancement Migration

### Overview

The goods tracking enhancement changes the industry `carDemandConfig` schema to support:
- Tracking specific goods (commodities) being shipped/received
- Multiple compatible AAR types per good
- Direction-specific demand (inbound vs outbound)

### Migration Scripts

#### 1. `migrate-goods-tracking.js`

Migrates existing database industries from the old schema to the new schema.

**Old Schema:**
```json
{
  "aarTypeId": "XM",
  "carsPerSession": 2,
  "frequency": 1
}
```

**New Schema:**
```json
{
  "goodsId": "general-merchandise",
  "direction": "inbound",
  "compatibleCarTypes": ["XM"],
  "carsPerSession": 2,
  "frequency": 1
}
```

**Usage:**

```bash
# Dry run (preview changes without applying)
node backend/src/scripts/migrate-goods-tracking.js --dry-run

# Apply migration
node backend/src/scripts/migrate-goods-tracking.js
```

**What it does:**
- Creates default "general-merchandise" good if it doesn't exist
- Migrates all industries with old `carDemandConfig` format
- Removes deprecated fields: `goodsReceived`, `goodsToShip`, `preferredCarTypes`
- Converts single `aarTypeId` to `compatibleCarTypes` array
- Defaults to `goodsId: "general-merchandise"` and `direction: "inbound"`

#### 2. `update-seed-data.js`

Updates the seed data file (`data/seed/seed-data.json`) to use the new schema.

**Usage:**

```bash
node backend/src/scripts/update-seed-data.js
```

**What it does:**
- Creates backup of seed data file
- Removes deprecated fields from all industries
- Adds `carDemandConfig: []` to industries without it
- Adds example demand configs to demonstration industries:
  - Lumber Mill (logs inbound, lumber outbound)
  - Grain Elevator (grain inbound)
  - Food Distribution (food products inbound/outbound)

### Migration Order

For a fresh installation:
1. Run `update-seed-data.js` to update seed data file
2. Import seed data through the application
3. No database migration needed (data is already in new format)

For existing installations:
1. Run `migrate-goods-tracking.js --dry-run` to preview changes
2. Run `migrate-goods-tracking.js` to apply migration
3. Optionally update seed data with `update-seed-data.js` for future imports

### Rollback

If you need to rollback:
1. Restore from database backup (if available)
2. For seed data, restore from `.backup.json` file created by update script

### Validation

After migration, verify:
- All industries have valid `carDemandConfig` (or empty array)
- No industries have deprecated fields
- Car order generation works correctly
- Switch list generation matches cars to orders using `compatibleCarTypes`

### Example Configurations

**Lumber Mill:**
```json
{
  "carDemandConfig": [
    {
      "goodsId": "logs",
      "direction": "inbound",
      "compatibleCarTypes": ["GS", "FB", "FBC"],
      "carsPerSession": 2,
      "frequency": 1
    },
    {
      "goodsId": "lumber",
      "direction": "outbound",
      "compatibleCarTypes": ["XM", "FBC"],
      "carsPerSession": 1,
      "frequency": 1
    }
  ]
}
```

**Grain Elevator:**
```json
{
  "carDemandConfig": [
    {
      "goodsId": "grain",
      "direction": "inbound",
      "compatibleCarTypes": ["HM", "HT"],
      "carsPerSession": 3,
      "frequency": 1
    }
  ]
}
```

## Troubleshooting

**Error: "Good 'xxx' does not exist"**
- Ensure the goods collection has the referenced goods
- Check that goodsId matches an existing good _id

**Error: "AAR type 'xxx' does not exist"**
- Ensure the aarTypes collection has the referenced AAR types
- Check that all compatibleCarTypes match existing AAR type _ids

**Migration shows 0 industries migrated**
- Industries may already be migrated
- Check if industries have `goodsId` field in their `carDemandConfig`

## Support

For issues or questions about migration, refer to:
- `/docs/GOODS_TRACKING_IMPLEMENTATION.md` - Full implementation plan
- Model tests: `backend/src/tests/models/industry.model.test.js`
