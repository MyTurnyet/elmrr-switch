#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read all input files
const rollingStock = JSON.parse(fs.readFileSync(path.join(__dirname, 'rolling-stock.json'), 'utf8'));
const locations = JSON.parse(fs.readFileSync(path.join(__dirname, 'locations.json'), 'utf8'));
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'seed-data.json'), 'utf8'));

// Since ObjectIds don't match between files, we'll create a mapping based on the
// 16 unique homeYard ObjectIds found in rolling-stock.json and distribute them
// across the available yards in seed-data.json

// Get unique homeYard ObjectIds from rolling-stock
const uniqueHomeYards = [...new Set(rollingStock.map(car => car.homeYard.$oid))];
console.log(`Found ${uniqueHomeYards.length} unique homeYard ObjectIds`);

// Available yards from seed-data.json (industries where isYard = true)
const availableYards = seedData.industries
  .filter(ind => ind.isYard)
  .map(ind => ind.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

console.log('Available yards:', availableYards);

// Create a consistent mapping from ObjectIds to yards
// We'll distribute the 16 unique ObjectIds across the available yards
const oidToYardMapping = {};
uniqueHomeYards.forEach((oid, index) => {
  // Round-robin distribution across available yards
  const yardIndex = index % availableYards.length;
  oidToYardMapping[oid] = availableYards[yardIndex];
});

console.log('ObjectId to Yard mapping:', oidToYardMapping);

// Transform each car
const transformedCars = rollingStock.map(car => {
  const homeYardOid = car.homeYard.$oid;
  const yardId = oidToYardMapping[homeYardOid] || 'interbay-yard'; // Default fallback

  return {
    reportingMarks: String(car.roadName),
    reportingNumber: String(car.roadNumber),
    carType: String(car.aarType),
    color: String(car.color).toUpperCase(),
    notes: car.description || '',
    homeYard: yardId,
    currentIndustry: yardId,
    isInService: true
  };
});

console.log(`Transformed ${transformedCars.length} cars`);
console.log(`Sample transformed car:`, JSON.stringify(transformedCars[0], null, 2));

// Replace cars in seed data
seedData.cars = transformedCars;

// Write updated seed data
fs.writeFileSync(
  path.join(__dirname, 'seed', 'seed-data.json'),
  JSON.stringify(seedData, null, 2),
  'utf8'
);

console.log(`Successfully wrote ${transformedCars.length} cars to seed-data.json`);

// Print some statistics
const carsByYard = {};
transformedCars.forEach(car => {
  carsByYard[car.homeYard] = (carsByYard[car.homeYard] || 0) + 1;
});

console.log('\nCars by yard:');
Object.entries(carsByYard)
  .sort((a, b) => b[1] - a[1])
  .forEach(([yard, count]) => {
    console.log(`  ${yard}: ${count} cars`);
  });
