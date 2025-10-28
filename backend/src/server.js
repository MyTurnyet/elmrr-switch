import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import logger
import logger from './utils/logger.js';

// Import configuration
import { 
  config, 
  getServerConfig, 
  getApiConfig, 
  getLoggingConfig,
  getSecurityConfig,
  isDevelopment,
  isProduction 
} from './config/index.js';

// Import routes
import carsRouter from './routes/cars.js';
import locomotivesRouter from './routes/locomotives.js';
import industriesRouter from './routes/industries.js';
import stationsRouter from './routes/stations.js';
import goodsRouter from './routes/goods.js';
import aarTypesRouter from './routes/aarTypes.js';
import blocksRouter from './routes/blocks.js';
import tracksRouter from './routes/tracks.js';
import routesRouter from './routes/routes.js';
import importRouter from './routes/import.js';
import operatingSessionsRouter from './routes/operatingSessions.js';
import carOrdersRouter from './routes/carOrders.js';
import trainsRouter from './routes/trains.js';

// Import error handling middleware
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import API versioning middleware
import { createVersionedRouter, versionHeaderMiddleware } from './middleware/apiVersioning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const serverConfig = getServerConfig();
const apiConfig = getApiConfig();
const loggingConfig = getLoggingConfig();
const securityConfig = getSecurityConfig();

// Middleware
app.use(cors({
  origin: serverConfig.cors.origin,
  credentials: serverConfig.cors.credentials
}));

// HTTP request logging with Winston
app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json({ limit: apiConfig.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: apiConfig.bodyLimit }));

// Initialize operating session on startup
import { dbHelpers } from './database/index.js';
import { validateOperatingSession } from './models/operatingSession.js';

const initializeOperatingSession = async () => {
  try {
    const sessions = await dbHelpers.findAll('operatingSessions');
    
    if (sessions.length === 0) {
      logger.info('Initializing operating session...');
      
      const { error, value } = validateOperatingSession({
        currentSessionNumber: 1,
        sessionDate: new Date().toISOString(),
        description: 'Initial operating session',
        previousSessionSnapshot: null
      });

      if (error) {
        logger.error('Failed to validate initial session', { error: error.details[0].message });
        return;
      }

      await dbHelpers.create('operatingSessions', value);
      logger.info('Operating session initialized', { sessionNumber: 1 });
    } else {
      logger.info('Operating session found', { sessionNumber: sessions[0].currentSessionNumber });
    }
  } catch (error) {
    logger.logError(error, { context: 'initializeOperatingSession' });
  }
};

// Initialize session on startup
initializeOperatingSession();

// Create v1 API router
const v1Router = createVersionedRouter('v1');

// Add version header middleware to v1 routes
v1Router.use(versionHeaderMiddleware);

// Mount all routes under v1
v1Router.use('/cars', carsRouter);
v1Router.use('/locomotives', locomotivesRouter);
v1Router.use('/industries', industriesRouter);
v1Router.use('/stations', stationsRouter);
v1Router.use('/goods', goodsRouter);
v1Router.use('/aar-types', aarTypesRouter);
v1Router.use('/blocks', blocksRouter);
v1Router.use('/tracks', tracksRouter);
v1Router.use('/routes', routesRouter);
v1Router.use('/sessions', operatingSessionsRouter);
v1Router.use('/car-orders', carOrdersRouter);
v1Router.use('/trains', trainsRouter);
v1Router.use('/import', importRouter);

// Health check endpoint (versioned)
v1Router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ELMRR Switch Backend',
    version: 'v1'
  });
});

// Mount v1 router
app.use('/api/v1', v1Router);

// Root health check (unversioned for monitoring)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ELMRR Switch Backend',
    apiVersions: ['v1']
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(serverConfig.port, serverConfig.host, () => {
  logger.info('🚂 ELMRR Switch Backend started', {
    host: serverConfig.host,
    port: serverConfig.port,
    environment: serverConfig.env,
    healthCheck: `http://${serverConfig.host}:${serverConfig.port}/health`,
    apiV1: `http://${serverConfig.host}:${serverConfig.port}/api/v1/`,
    databasePath: config.database.path,
    corsOrigin: serverConfig.cors.origin
  });
});
