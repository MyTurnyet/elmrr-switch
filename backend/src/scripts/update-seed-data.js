/**
 * Update Seed Data Script
 * 
 * Updates the seed-data.json file to remove deprecated fields
 * and add example carDemandConfig entries for demonstration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DATA_PATH = path.join(__dirname, '../../../data/seed/seed-data.json');

/**
 * Update industries in seed data
 */
function updateIndustries(seedData) {
  console.log('\n=== Updating Industries ===\n');
  
  let updated = 0;
  
  for (const industry of seedData.industries) {
    let changed = false;
    
    // Remove deprecated fields
    if (industry.goodsReceived !== undefined) {
      delete industry.goodsReceived;
      changed = true;
    }
    if (industry.goodsToShip !== undefined) {
      delete industry.goodsToShip;
      changed = true;
    }
    if (industry.preferredCarTypes !== undefined) {
      delete industry.preferredCarTypes;
      changed = true;
    }
    
    // Add carDemandConfig if not present
    if (!industry.carDemandConfig) {
      industry.carDemandConfig = [];
      changed = true;
    }
    
    if (changed) {
      console.log(`  ✓ Updated: ${industry.name}`);
      updated++;
    }
  }
  
  // Add example demand configs to specific industries
  addExampleDemandConfigs(seedData.industries);
  
  console.log(`\nTotal industries updated: ${updated}`);
  return seedData;
}

/**
 * Add example demand configurations to demonstrate the feature
 */
function addExampleDemandConfigs(industries) {
  console.log('\n=== Adding Example Demand Configs ===\n');
  
  const examples = [
    {
      id: 'cascade-lumber-mill',
      name: 'Lumber Mill',
      config: [
        {
          goodsId: 'logs',
          direction: 'inbound',
          compatibleCarTypes: ['GS', 'FB', 'FBC'],
          carsPerSession: 2,
          frequency: 1
        },
        {
          goodsId: 'lumber',
          direction: 'outbound',
          compatibleCarTypes: ['XM', 'FBC'],
          carsPerSession: 1,
          frequency: 1
        }
      ]
    },
    {
      id: 'walla-grain-elevator',
      name: 'Grain Elevator',
      config: [
        {
          goodsId: 'grain',
          direction: 'inbound',
          compatibleCarTypes: ['HM', 'HT'],
          carsPerSession: 3,
          frequency: 1
        }
      ]
    },
    {
      id: 'seattle-food-distribution',
      name: 'Food Distribution',
      config: [
        {
          goodsId: 'food-products',
          direction: 'inbound',
          compatibleCarTypes: ['XM', 'XAP'],
          carsPerSession: 2,
          frequency: 2
        },
        {
          goodsId: 'food-products',
          direction: 'outbound',
          compatibleCarTypes: ['XM', 'XAP'],
          carsPerSession: 1,
          frequency: 2
        }
      ]
    }
  ];
  
  for (const example of examples) {
    const industry = industries.find(ind => ind._id === example.id);
    if (industry) {
      industry.carDemandConfig = example.config;
      console.log(`  ✓ Added demand config to: ${example.name}`);
      console.log(`    - ${example.config.length} demand config(s)`);
    }
  }
}

/**
 * Main update function
 */
async function updateSeedData() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Update Seed Data - Goods Tracking Enhancement            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Read seed data
    console.log(`\nReading seed data from: ${SEED_DATA_PATH}`);
    const rawData = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    const seedData = JSON.parse(rawData);
    
    // Create backup
    const backupPath = SEED_DATA_PATH.replace('.json', '.backup.json');
    fs.writeFileSync(backupPath, rawData);
    console.log(`✓ Backup created: ${backupPath}`);
    
    // Update industries
    const updatedData = updateIndustries(seedData);
    
    // Write updated data
    fs.writeFileSync(SEED_DATA_PATH, JSON.stringify(updatedData, null, 2));
    console.log(`\n✓ Seed data updated successfully!`);
    console.log(`  File: ${SEED_DATA_PATH}`);
    
  } catch (error) {
    console.error('\n✗ Update failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSeedData();
}

export { updateSeedData };
