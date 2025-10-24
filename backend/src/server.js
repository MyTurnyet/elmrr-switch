import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

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
app.use(morgan(loggingConfig.format));
app.use(express.json({ limit: apiConfig.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: apiConfig.bodyLimit }));

// Initialize operating session on startup
import { dbHelpers } from './database/index.js';
import { validateOperatingSession } from './models/operatingSession.js';

const initializeOperatingSession = async () => {
  try {
    const sessions = await dbHelpers.findAll('operatingSessions');
    
    if (sessions.length === 0) {
      console.log('🎯 Initializing operating session...');
      
      const { error, value } = validateOperatingSession({
        currentSessionNumber: 1,
        sessionDate: new Date().toISOString(),
        description: 'Initial operating session',
        previousSessionSnapshot: null
      });

      if (error) {
        console.error('❌ Failed to validate initial session:', error.details[0].message);
        return;
      }

      await dbHelpers.create('operatingSessions', value);
      console.log('✅ Operating session initialized (Session 1)');
    } else {
      console.log(`✅ Operating session found (Session ${sessions[0].currentSessionNumber})`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize operating session:', error.message);
  }
};

// Initialize session on startup
initializeOperatingSession();

// Routes
app.use('/api/cars', carsRouter);
app.use('/api/locomotives', locomotivesRouter);
app.use('/api/industries', industriesRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/goods', goodsRouter);
app.use('/api/aar-types', aarTypesRouter);
app.use('/api/blocks', blocksRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/routes', routesRouter);
app.use('/api/sessions', operatingSessionsRouter);
app.use('/api/car-orders', carOrdersRouter);
app.use('/api/trains', trainsRouter);
app.use('/api/import', importRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ELMRR Switch Backend'
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`🚂 ELMRR Switch Backend running on ${serverConfig.host}:${serverConfig.port}`);
  console.log(`📊 Health check: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`🔧 Environment: ${serverConfig.env}`);
  console.log(`📁 Database path: ${config.database.path}`);
  console.log(`🔒 CORS origin: ${serverConfig.cors.origin}`);
});
