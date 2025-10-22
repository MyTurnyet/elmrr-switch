# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is ELMRR Switch, a Model Railroad Layout Tracking System for managing rolling stock, operations, and switch list generation. The system is a full-stack web application designed to track ~300+ railroad cars across a model railroad layout with support for operating sessions.

**Tech Stack:**
- Frontend: Vite + React + TypeScript with Material-UI
- Backend: Node.js + Express with NeDB (file-based NoSQL database)
- State Management: React Context API
- Testing: Jest (backend), planned Vitest (frontend)

## Essential Commands

### Development

```bash
# Backend (run from /backend)
npm run dev          # Start backend dev server with nodemon (port 3001)
npm start            # Start backend production server
npm test             # Run all Jest tests
npm test -- <file>   # Run specific test file

# Frontend (run from /frontend)
npm run dev          # Start Vite dev server (port 5173)
npm run build        # TypeScript build + Vite production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing

```bash
# Backend testing
cd backend
npm test                                           # Run all tests
npm test -- src/tests/routes/cars.routes.test.js  # Run specific test file
npm test -- --watch                                # Watch mode

# Note: Tests use in-memory NeDB instances to avoid affecting production data
```

## Architecture Overview

### Data Model Relationships

The system models a model railroad with the following hierarchy:

```
Blocks (physical track sections)
  └── Stations (on-layout or virtual "fiddle yard" stations)
      └── Industries (destinations that receive/ship goods)
          └── Tracks (individual storage tracks within industries)

Rolling Stock (cars) ─┐
Locomotives          ─┼─→ Current Location (Industry)
                      │   Home Yard (Industry)
                      └─→ Car Type (AAR Type)

Goods (commodities)
  └── Compatible Car Types (AAR Types)

Routes (ordered list of stations for train operations)
  └── Station Sequence

Trains (created per operating session)
  └── Assigned Locomotives + Route
```

### Backend Architecture

**Database Layer** (`backend/src/database/index.js`):
- NeDB collections stored as files in `backend/data/*.db`
- Collections: cars, locomotives, industries, stations, goods, aarTypes, blocks, tracks, trains, routes, operatingSessions
- Indexed fields for performance (reportingMarks, reportingNumber, currentIndustry, etc.)

**API Layer** (`backend/src/routes/*.js`):
- RESTful endpoints following pattern: `/api/{resource}`
- Standard CRUD operations: GET (all/by-id), POST, PUT, DELETE
- Special endpoint: `/api/import` for bulk JSON data import with validation

**Key API Endpoints:**
```
GET    /api/health                 # Health check
GET    /api/cars                   # List all cars
GET    /api/cars/:id               # Get car by ID
PUT    /api/cars/:id               # Update car
DELETE /api/cars/:id               # Delete car
GET    /api/routes                 # List all routes (with filtering)
GET    /api/routes/:id             # Get route by ID
POST   /api/routes                 # Create new route
PUT    /api/routes/:id             # Update route
DELETE /api/routes/:id             # Delete route
POST   /api/import                 # Bulk import JSON data
```

**Data Validation:**
- Uses Joi schemas in model files (`backend/src/models/*.js`)
- Validation happens at route level before database operations
- Import route validates entire dataset before committing

### Frontend Architecture

**State Management** (`frontend/src/contexts/AppContext.tsx`):
- Centralized state using React Context + useReducer
- API calls abstracted into context methods (fetchCars, updateCar, etc.)
- Global loading and error states

**Page Structure** (`frontend/src/pages/`):
- Dashboard: Overview with quick stats and recent activity
- DataImport: JSON data upload with validation and progress tracking
- (Planned: Car management, Industry view, Train operations)

**Type System** (`frontend/src/types/index.ts`):
- TypeScript interfaces matching backend data models
- Ensures type safety across frontend components

**API Service** (`frontend/src/services/api.ts`):
- Centralized API client pointing to `http://localhost:3001/api`
- Generic fetch wrappers for all CRUD operations

## Key Implementation Details

### NeDB Usage Patterns

NeDB operations use callback style, but can be promisified:

```javascript
// Find documents
collections.cars.find({ carType: 'Boxcar' }, (err, docs) => { ... });

// Insert with validation
collections.cars.insert(validatedData, (err, newDoc) => { ... });

// Update by ID
collections.cars.update({ _id: id }, { $set: updates }, {}, (err, numReplaced) => { ... });
```

### Test Structure

- Tests use `__mocks__` directory for mocking external dependencies (multer)
- Setup file (`backend/src/tests/setup.js`) creates in-memory NeDB instances
- Route tests use supertest for HTTP assertions
- Model tests validate Joi schemas

### Railroad-Specific Terminology

- **AAR Type**: Association of American Railroads car type designation (e.g., "XM" for boxcar)
- **Reporting Marks**: Railroad company initials on car (e.g., "ATSF")
- **Reporting Number**: Unique car number within reporting marks (e.g., "12345")
- **Switch List**: Document listing car movements for a train crew during an operating session
- **Fiddle Yard**: Off-layout staging area representing distant locations

## Development Guidelines

### When Adding New Features

1. **Backend first**: Define data model with Joi schema, create route, write tests
2. **Frontend second**: Add TypeScript interface, update context, create/update UI components
3. **Test coverage**: All route files must have corresponding `.test.js` files in `backend/src/tests/routes/`

### Common Patterns

**Adding a new resource:**
1. Create NeDB collection in `backend/src/database/index.js`
2. Add Joi validation schema in `backend/src/models/{resource}.js`
3. Create route handler in `backend/src/routes/{resource}.js`
4. Register route in `backend/src/server.js`
5. Add TypeScript interface in `frontend/src/types/index.ts`
6. Add context actions/methods in `frontend/src/contexts/AppContext.tsx`
7. Write comprehensive tests in `backend/src/tests/routes/{resource}.routes.test.js`

**Updating car/locomotive locations:**
- Always update both `currentIndustry` field
- Track `lastMoved` timestamp on rolling stock
- Increment `sessionsCount` when advancing operating sessions

### Performance Considerations

- System designed for ~300 cars initially but should scale
- NeDB indexes are configured for common queries (see `backend/src/database/index.js`)
- Frontend pagination should be implemented for large datasets
- Consider caching frequently accessed reference data (AAR types, goods, stations)

## Current Project Status

Phase 1 (Core Functionality) is mostly complete:
- ✅ Full backend API with all CRUD endpoints
- ✅ Comprehensive test suite for backend routes
- ✅ Data import functionality with validation
- ✅ Basic dashboard and navigation
- ⏳ Car management UI (planned)
- ⏳ Industry management UI (planned)

Next phases will add:
- Phase 2: Train operations, switch list generation, route management
- Phase 3: Advanced reporting, data visualization, mobile optimization

## Important Files

- `docs/railroad-layout-spec.md` - Complete system specification and requirements
- `docs/IMPLEMENTATION_PLAN.md` - Development roadmap and phase breakdown
- `backend/src/server.js` - Express app entry point and route registration
- `backend/src/database/index.js` - NeDB database initialization
- `frontend/src/contexts/AppContext.tsx` - Global state management
- `frontend/src/types/index.ts` - TypeScript type definitions
