/**
 * Migration Script: Goods Tracking Enhancement
 * 
 * This script migrates existing industries from the old carDemandConfig schema
 * to the new goods tracking schema.
 * 
 * Old Schema:
 * {
 *   aarTypeId: string,
 *   carsPerSession: number,
 *   frequency: number
 * }
 * 
 * New Schema:
 * {
 *   goodsId: string,
 *   direction: "inbound" | "outbound",
 *   compatibleCarTypes: string[],
 *   carsPerSession: number,
 *   frequency: number
 * }
 * 
 * Also removes deprecated fields: goodsReceived, goodsToShip, preferredCarTypes
 */

import { dbHelpers } from '../database/index.js';
import { validateIndustry } from '../models/industry.js';

const DEFAULT_GOODS_ID = 'general-merchandise';
const DEFAULT_DIRECTION = 'inbound';

/**
 * Migrate a single industry's carDemandConfig
 */
function migrateIndustryDemandConfig(industry) {
  const migratedConfig = [];
  
  if (industry.carDemandConfig && Array.isArray(industry.carDemandConfig)) {
    for (const oldConfig of industry.carDemandConfig) {
      // Check if already migrated (has goodsId field)
      if (oldConfig.goodsId) {
        migratedConfig.push(oldConfig);
        continue;
      }
      
      // Migrate old schema to new schema
      const newConfig = {
        goodsId: DEFAULT_GOODS_ID, // Default to general merchandise
        direction: DEFAULT_DIRECTION, // Default to inbound
        compatibleCarTypes: oldConfig.aarTypeId ? [oldConfig.aarTypeId] : [], // Convert single to array
        carsPerSession: oldConfig.carsPerSession,
        frequency: oldConfig.frequency
      };
      
      migratedConfig.push(newConfig);
    }
  }
  
  return migratedConfig;
}

/**
 * Create the default good if it doesn't exist
 */
async function ensureDefaultGoodExists() {
  const existingGood = await dbHelpers.findById('goods', DEFAULT_GOODS_ID).catch(() => null);
  
  if (!existingGood) {
    console.log(`Creating default good: ${DEFAULT_GOODS_ID}`);
    await dbHelpers.create('goods', {
      _id: DEFAULT_GOODS_ID,
      name: 'General Merchandise',
      description: 'Boxed goods and general freight',
      category: 'General'
    });
    console.log('✓ Default good created');
  } else {
    console.log('✓ Default good already exists');
  }
}

/**
 * Migrate all industries
 */
async function migrateIndustries(dryRun = false) {
  console.log('\n=== Industry Migration ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  
  // Get all industries
  const industries = await dbHelpers.findAll('industries');
  console.log(`Found ${industries.length} industries to process\n`);
  
  const stats = {
    total: industries.length,
    migrated: 0,
    alreadyMigrated: 0,
    noDemandConfig: 0,
    errors: 0
  };
  
  for (const industry of industries) {
    try {
      // Check if industry needs migration
      const needsMigration = industry.carDemandConfig && 
                            industry.carDemandConfig.length > 0 &&
                            industry.carDemandConfig.some(config => !config.goodsId);
      
      const hasDeprecatedFields = industry.goodsReceived !== undefined ||
                                  industry.goodsToShip !== undefined ||
                                  industry.preferredCarTypes !== undefined;
      
      if (!needsMigration && !hasDeprecatedFields) {
        if (industry.carDemandConfig && industry.carDemandConfig.length > 0) {
          console.log(`  ✓ ${industry.name} - Already migrated`);
          stats.alreadyMigrated++;
        } else {
          console.log(`  - ${industry.name} - No demand config`);
          stats.noDemandConfig++;
        }
        continue;
      }
      
      // Prepare updated industry data
      const updatedIndustry = {
        name: industry.name,
        stationId: industry.stationId,
        isYard: industry.isYard,
        isOnLayout: industry.isOnLayout,
        carDemandConfig: migrateIndustryDemandConfig(industry)
      };
      
      // Validate the migrated data
      const { error } = validateIndustry(updatedIndustry);
      if (error) {
        console.error(`  ✗ ${industry.name} - Validation failed:`, error.message);
        stats.errors++;
        continue;
      }
      
      // Update in database (if not dry run)
      if (!dryRun) {
        await dbHelpers.update('industries', industry._id, updatedIndustry);
      }
      
      console.log(`  ✓ ${industry.name} - Migrated`);
      if (hasDeprecatedFields) {
        console.log(`    - Removed deprecated fields`);
      }
      if (needsMigration) {
        console.log(`    - Migrated ${updatedIndustry.carDemandConfig.length} demand config(s)`);
      }
      
      stats.migrated++;
      
    } catch (error) {
      console.error(`  ✗ ${industry.name} - Error:`, error.message);
      stats.errors++;
    }
  }
  
  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total industries: ${stats.total}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Already migrated: ${stats.alreadyMigrated}`);
  console.log(`No demand config: ${stats.noDemandConfig}`);
  console.log(`Errors: ${stats.errors}`);
  
  return stats;
}

/**
 * Main migration function
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Goods Tracking Enhancement - Data Migration              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: Ensure default good exists
    await ensureDefaultGoodExists();
    
    // Step 2: Migrate industries
    const stats = await migrateIndustries(dryRun);
    
    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
      console.log('Run without --dry-run flag to apply changes');
    } else {
      console.log('\n✓ Migration completed successfully!');
    }
    
    process.exit(stats.errors > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateIndustries, ensureDefaultGoodExists };
