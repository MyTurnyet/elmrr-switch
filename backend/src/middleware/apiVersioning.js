/**
 * API Versioning Middleware
 * 
 * Provides versioning support for the API to enable backward compatibility
 * and smooth API evolution.
 * 
 * Current Strategy:
 * - All routes are mounted under /api/v1/
 * - Version is extracted from URL path
 * - Future versions can be added without breaking existing clients
 * 
 * Usage:
 * ```javascript
 * import { createVersionedRouter } from './middleware/apiVersioning.js';
 * 
 * const v1Router = createVersionedRouter();
 * v1Router.use('/cars', carsRouter);
 * app.use('/api/v1', v1Router);
 * ```
 */

import express from 'express';

/**
 * Extract API version from request path
 * @param {Request} req - Express request object
 * @returns {string|null} - Version string (e.g., 'v1') or null
 */
export const getApiVersion = (req) => {
  const match = req.path.match(/^\/api\/(v\d+)/);
  return match ? match[1] : null;
};

/**
 * Middleware to add version information to request object
 */
export const versionMiddleware = (req, res, next) => {
  req.apiVersion = getApiVersion(req);
  next();
};

/**
 * Create a versioned router for a specific API version
 * @param {string} version - API version (e.g., 'v1')
 * @returns {Router} - Express router configured for the version
 */
export const createVersionedRouter = (version = 'v1') => {
  const router = express.Router();
  
  // Add version information to all requests in this router
  router.use((req, res, next) => {
    req.apiVersion = version;
    next();
  });
  
  return router;
};

/**
 * Middleware to handle deprecated API versions
 * @param {string} version - Version to deprecate
 * @param {string} sunsetDate - ISO date string when version will be removed
 * @param {string} migrationGuide - URL to migration guide
 */
export const deprecationMiddleware = (version, sunsetDate, migrationGuide) => {
  return (req, res, next) => {
    if (req.apiVersion === version) {
      res.set({
        'X-API-Deprecated': 'true',
        'X-API-Sunset-Date': sunsetDate,
        'X-API-Migration-Guide': migrationGuide,
        'Deprecation': `version="${version}"`
      });
    }
    next();
  };
};

/**
 * Middleware to enforce minimum API version
 * @param {string} minVersion - Minimum supported version (e.g., 'v1')
 */
export const enforceMinVersion = (minVersion) => {
  return (req, res, next) => {
    const version = req.apiVersion;
    
    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'API version required',
        message: 'Please specify an API version in the URL (e.g., /api/v1/...)',
        supportedVersions: [minVersion]
      });
    }
    
    // Simple version comparison (assumes format v1, v2, etc.)
    const versionNum = parseInt(version.substring(1));
    const minVersionNum = parseInt(minVersion.substring(1));
    
    if (versionNum < minVersionNum) {
      return res.status(410).json({
        success: false,
        error: 'API version no longer supported',
        message: `API ${version} is no longer supported. Please upgrade to ${minVersion} or later.`,
        supportedVersions: [minVersion]
      });
    }
    
    next();
  };
};

/**
 * Get list of supported API versions
 * @returns {Array<string>} - Array of supported versions
 */
export const getSupportedVersions = () => {
  return ['v1']; // Update this as new versions are added
};

/**
 * Middleware to add API version information to response headers
 */
export const versionHeaderMiddleware = (req, res, next) => {
  res.set({
    'X-API-Version': req.apiVersion || 'unknown',
    'X-API-Supported-Versions': getSupportedVersions().join(', ')
  });
  next();
};
