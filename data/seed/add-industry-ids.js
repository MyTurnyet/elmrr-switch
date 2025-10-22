import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('seed-data.json', 'utf8'));

// Create slug from industry name + station
const createId = (name, stationId) => {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // For yards, just use the slug directly
  if (name.toLowerCase().includes('yard')) {
    return slug;
  }

  // For non-yards, prefix with station if not already included
  const stationPrefix = stationId.split('-')[0];
  if (!slug.includes(stationPrefix)) {
    return `${stationPrefix}-${slug}`;
  }

  return slug;
};

// Add _id to each industry
data.industries = data.industries.map(industry => {
  const id = createId(industry.name, industry.stationId);
  return {
    _id: id,
    ...industry
  };
});

// Write back to file
writeFileSync('seed-data.json', JSON.stringify(data, null, 2));

console.log('✓ Added _id fields to all industries');
console.log('\nSample industries with IDs:');
data.industries.slice(0, 5).forEach(ind => {
  console.log(`  ${ind._id} → ${ind.name}`);
});
