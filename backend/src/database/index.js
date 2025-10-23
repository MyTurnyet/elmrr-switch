import Datastore from 'nedb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file paths
const dbPath = path.join(__dirname, '../../data');

// Initialize NeDB collections
export const collections = {
  cars: new Datastore({ filename: path.join(dbPath, 'cars.db'), autoload: true }),
  locomotives: new Datastore({ filename: path.join(dbPath, 'locomotives.db'), autoload: true }),
  industries: new Datastore({ filename: path.join(dbPath, 'industries.db'), autoload: true }),
  stations: new Datastore({ filename: path.join(dbPath, 'stations.db'), autoload: true }),
  goods: new Datastore({ filename: path.join(dbPath, 'goods.db'), autoload: true }),
  aarTypes: new Datastore({ filename: path.join(dbPath, 'aarTypes.db'), autoload: true }),
  blocks: new Datastore({ filename: path.join(dbPath, 'blocks.db'), autoload: true }),
  tracks: new Datastore({ filename: path.join(dbPath, 'tracks.db'), autoload: true }),
  trains: new Datastore({ filename: path.join(dbPath, 'trains.db'), autoload: true }),
  routes: new Datastore({ filename: path.join(dbPath, 'routes.db'), autoload: true }),
  operatingSessions: new Datastore({ filename: path.join(dbPath, 'operatingSessions.db'), autoload: true }),
  carOrders: new Datastore({ filename: path.join(dbPath, 'carOrders.db'), autoload: true })
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
