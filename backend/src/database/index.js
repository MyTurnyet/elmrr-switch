import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabaseConfig } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database configuration
const dbConfig = getDatabaseConfig();
const dbPath = dbConfig.path;

// Initialize NeDB collections with configuration
const datastoreOptions = {
  autoload: dbConfig.autoload,
  timestampData: dbConfig.timestampData,
  corruptAlertThreshold: dbConfig.corruptAlertThreshold
};

export const collections = {
  cars: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'cars.db') }),
  locomotives: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'locomotives.db') }),
  industries: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'industries.db') }),
  stations: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'stations.db') }),
  goods: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'goods.db') }),
  aarTypes: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'aarTypes.db') }),
  blocks: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'blocks.db') }),
  tracks: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'tracks.db') }),
  trains: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'trains.db') }),
  routes: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'routes.db') }),
  operatingSessions: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'operatingSessions.db') }),
  carOrders: new Datastore({ ...datastoreOptions, filename: path.join(dbPath, 'carOrders.db') })
};

// Ensure indexes for better performance
collections.cars.ensureIndex({ fieldName: 'reportingMarks' });
collections.cars.ensureIndex({ fieldName: 'reportingNumber' });
collections.cars.ensureIndex({ fieldName: 'currentIndustry' });
collections.cars.ensureIndex({ fieldName: 'carType' });

collections.locomotives.ensureIndex({ fieldName: 'reportingMarks' });
collections.locomotives.ensureIndex({ fieldName: 'reportingNumber' });
collections.locomotives.ensureIndex({ fieldName: 'currentIndustry' });

collections.industries.ensureIndex({ fieldName: 'name' });
collections.industries.ensureIndex({ fieldName: 'stationId' });

collections.stations.ensureIndex({ fieldName: 'name' });
collections.stations.ensureIndex({ fieldName: 'block' });

collections.carOrders.ensureIndex({ fieldName: 'industryId' });
collections.carOrders.ensureIndex({ fieldName: 'sessionNumber' });
collections.carOrders.ensureIndex({ fieldName: 'status' });
collections.carOrders.ensureIndex({ fieldName: 'aarTypeId' });

collections.trains.ensureIndex({ fieldName: 'sessionNumber' });
collections.trains.ensureIndex({ fieldName: 'status' });
collections.trains.ensureIndex({ fieldName: 'routeId' });
collections.trains.ensureIndex({ fieldName: 'name' });

// Helper functions for database operations
export const dbHelpers = {
  // Generic CRUD operations
  async findAll(collection) {
    return new Promise((resolve, reject) => {
      collections[collection].find({}, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  },

  async findById(collection, id) {
    return new Promise((resolve, reject) => {
      collections[collection].findOne({ _id: id }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  },

  async findByQuery(collection, query) {
    return new Promise((resolve, reject) => {
      collections[collection].find(query, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  },

  async create(collection, data) {
    return new Promise((resolve, reject) => {
      collections[collection].insert(data, (err, newDoc) => {
        if (err) reject(err);
        else resolve(newDoc);
      });
    });
  },

  async update(collection, id, data) {
    return new Promise((resolve, reject) => {
      collections[collection].update({ _id: id }, { $set: data }, {}, (err, numReplaced) => {
        if (err) reject(err);
        else resolve(numReplaced);
      });
    });
  },

  async delete(collection, id) {
    return new Promise((resolve, reject) => {
      collections[collection].remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
  },

  // Bulk operations for data import
  async bulkInsert(collection, dataArray) {
    return new Promise((resolve, reject) => {
      collections[collection].insert(dataArray, (err, newDocs) => {
        if (err) reject(err);
        else resolve(newDocs);
      });
    });
  },

  async clearCollection(collection) {
    return new Promise((resolve, reject) => {
      collections[collection].remove({}, { multi: true }, (err, numRemoved) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
  }
};

export default collections;
