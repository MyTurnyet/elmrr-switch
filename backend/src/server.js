import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/import', importRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ELMRR Switch Backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚂 ELMRR Switch Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
