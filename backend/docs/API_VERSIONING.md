# API Versioning Strategy

## Overview

The ELMRR Switch Backend API uses URL-based versioning to ensure backward compatibility and smooth API evolution. All API endpoints are versioned using the `/api/v{version}/` prefix.

## Current Version

**Current API Version:** `v1`

All endpoints are available under `/api/v1/`

## Versioning Approach

### URL-Based Versioning

We use URL path versioning (e.g., `/api/v1/`, `/api/v2/`) because it:
- ✅ Is explicit and easy to understand
- ✅ Works well with HTTP caching
- ✅ Is simple to implement and test
- ✅ Allows multiple versions to coexist
- ✅ Is widely adopted industry standard

### Version Format

- **Format:** `/api/v{major}/`
- **Example:** `/api/v1/cars`
- **Pattern:** Major version only (no minor/patch versions in URL)

## API Endpoints (v1)

### Base URL
```
http://localhost:3001/api/v1
```

### Available Endpoints

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Cars** | `/api/v1/cars` | Rolling stock management |
| **Locomotives** | `/api/v1/locomotives` | Locomotive management |
| **Industries** | `/api/v1/industries` | Industry and demand configuration |
| **Stations** | `/api/v1/stations` | Station management |
| **Goods** | `/api/v1/goods` | Commodity types |
| **AAR Types** | `/api/v1/aar-types` | Car type classifications |
| **Blocks** | `/api/v1/blocks` | Track block management |
| **Tracks** | `/api/v1/tracks` | Track configuration |
| **Routes** | `/api/v1/routes` | Train route management |
| **Sessions** | `/api/v1/sessions` | Operating session management |
| **Car Orders** | `/api/v1/car-orders` | Car order and demand fulfillment |
| **Trains** | `/api/v1/trains` | Train operations and switch lists |
| **Import** | `/api/v1/import` | Data import/export |
| **Health** | `/api/v1/health` | API health check |

## Response Headers

All API responses include version information in headers:

```http
X-API-Version: v1
X-API-Supported-Versions: v1
```

### Example Response

```bash
curl -I http://localhost:3001/api/v1/cars
```

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Supported-Versions: v1
Content-Type: application/json
```

## Health Checks

### Versioned Health Check
```bash
GET /api/v1/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-27T18:00:00.000Z",
  "service": "ELMRR Switch Backend",
  "version": "v1"
}
```

### Root Health Check (Unversioned)
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-27T18:00:00.000Z",
  "service": "ELMRR Switch Backend",
  "apiVersions": ["v1"]
}
```

## Version Lifecycle

### Version States

1. **Current** - Actively developed and fully supported
2. **Deprecated** - Still functional but scheduled for removal
3. **Sunset** - No longer available

### Deprecation Process

When a version is deprecated, the API will include deprecation headers:

```http
X-API-Deprecated: true
X-API-Sunset-Date: 2026-01-01T00:00:00Z
X-API-Migration-Guide: https://docs.example.com/migration/v1-to-v2
Deprecation: version="v1"
```

### Deprecation Timeline

- **Announcement:** 6 months before deprecation
- **Deprecation:** Version marked as deprecated
- **Sunset:** 6 months after deprecation (12 months total notice)

## Adding New Versions

### Creating v2 Example

```javascript
// In server.js

// Create v2 router
const v2Router = createVersionedRouter('v2');
v2Router.use(versionHeaderMiddleware);

// Mount v2 routes (with breaking changes)
v2Router.use('/cars', carsV2Router);
v2Router.use('/locomotives', locomotivesV2Router);
// ... other routes

// Mount v2 router
app.use('/api/v2', v2Router);
```

### Version Coexistence

Multiple versions can run simultaneously:
- `/api/v1/cars` - Original implementation
- `/api/v2/cars` - New implementation with breaking changes

## Breaking vs Non-Breaking Changes

### Non-Breaking Changes (Same Version)
- ✅ Adding new endpoints
- ✅ Adding new optional fields to requests
- ✅ Adding new fields to responses
- ✅ Adding new query parameters (optional)
- ✅ Bug fixes that don't change behavior

### Breaking Changes (New Version Required)
- ❌ Removing endpoints
- ❌ Removing fields from responses
- ❌ Changing field types
- ❌ Making optional fields required
- ❌ Changing error response formats
- ❌ Changing authentication requirements

## Client Implementation

### Recommended Client Approach

```javascript
// Always specify version explicitly
const API_BASE = 'http://localhost:3001/api/v1';

// Make requests
fetch(`${API_BASE}/cars`)
  .then(response => response.json())
  .then(data => console.log(data));
```

### Version Detection

```javascript
// Check supported versions
fetch('http://localhost:3001/health')
  .then(response => response.json())
  .then(data => {
    console.log('Supported versions:', data.apiVersions);
  });
```

### Handling Deprecation

```javascript
fetch('http://localhost:3001/api/v1/cars')
  .then(response => {
    // Check for deprecation headers
    if (response.headers.get('X-API-Deprecated') === 'true') {
      const sunsetDate = response.headers.get('X-API-Sunset-Date');
      const migrationGuide = response.headers.get('X-API-Migration-Guide');
      
      console.warn(`API v1 deprecated. Sunset: ${sunsetDate}`);
      console.warn(`Migration guide: ${migrationGuide}`);
    }
    
    return response.json();
  });
```

## Middleware Reference

### Available Middleware

Located in `src/middleware/apiVersioning.js`:

#### `createVersionedRouter(version)`
Creates a versioned router for a specific API version.

```javascript
const v1Router = createVersionedRouter('v1');
```

#### `versionHeaderMiddleware`
Adds version information to response headers.

```javascript
router.use(versionHeaderMiddleware);
```

#### `deprecationMiddleware(version, sunsetDate, migrationGuide)`
Marks a version as deprecated with sunset information.

```javascript
app.use(deprecationMiddleware('v1', '2026-01-01T00:00:00Z', 'https://docs.example.com/migration'));
```

#### `enforceMinVersion(minVersion)`
Enforces a minimum API version requirement.

```javascript
app.use(enforceMinVersion('v1'));
```

#### `getApiVersion(req)`
Extracts API version from request path.

```javascript
const version = getApiVersion(req); // Returns 'v1' or null
```

## Testing

All tests have been updated to use versioned endpoints:

```javascript
// Test example
describe('Cars API v1', () => {
  it('should get all cars', async () => {
    const response = await request(app)
      .get('/api/v1/cars')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Running Tests

```bash
npm test
```

All 388 tests pass with versioned API endpoints.

## Migration Guide Template

When creating a new version, provide a migration guide:

### Example: v1 to v2 Migration

```markdown
# Migrating from v1 to v2

## Breaking Changes

### 1. Car Response Format
**v1:**
```json
{
  "id": "car1",
  "type": "flatcar"
}
```

**v2:**
```json
{
  "id": "car1",
  "carType": {
    "id": "flatcar",
    "name": "Flatcar"
  }
}
```

### 2. Endpoint Changes
- `/api/v1/aar-types` → `/api/v2/car-types`
- Query parameter `type` renamed to `carType`

## Migration Steps

1. Update base URL from `/api/v1` to `/api/v2`
2. Update response parsing for car objects
3. Update query parameters
4. Test thoroughly before sunset date
```

## Best Practices

### For API Developers

1. **Never break v1** - Create v2 for breaking changes
2. **Document everything** - Clear migration guides
3. **Test both versions** - Ensure coexistence works
4. **Communicate early** - Announce deprecations 6+ months ahead
5. **Monitor usage** - Track version adoption before sunset

### For API Consumers

1. **Always specify version** - Don't rely on defaults
2. **Monitor deprecation headers** - Plan migrations early
3. **Test new versions** - Validate before switching
4. **Update gradually** - Don't wait until sunset
5. **Handle errors gracefully** - Version might be unavailable

## Future Considerations

### Planned Features

- [ ] API version analytics/metrics
- [ ] Automatic version negotiation
- [ ] Version-specific rate limiting
- [ ] GraphQL versioning strategy
- [ ] SDK generation per version

### Version Roadmap

- **v1** (Current) - Initial API release
- **v2** (Planned) - Enhanced response formats, improved error handling
- **v3** (Future) - GraphQL support, real-time subscriptions

## Support

For questions about API versioning:
- Check this documentation
- Review migration guides
- Contact the development team

---

**Last Updated:** October 27, 2025  
**Current Version:** v1  
**Status:** Active Development
