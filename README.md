# ELMRR Switch - Model Railroad Layout Tracking System

A comprehensive web-based application for managing model railroad operations, tracking rolling stock, and generating switch lists. Built with modern web technologies for desktop and mobile use.

[![Phase 2.2 Complete](https://img.shields.io/badge/Phase%202.2-Complete-success)](docs/IMPLEMENTATION_PLAN.md)
[![Backend Tests](https://img.shields.io/badge/backend%20tests-413%20passing-success)]()
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-162%20passing-success)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()

## 🚂 Features

### ✅ Complete (Phase 1, 2.1 & 2.2)

- **Dashboard**: Overview with train operations integration
  - Real-time statistics for cars, locomotives, industries, routes
  - Train operations summary with status breakdown
  - Car orders tracking with fulfillment rate
  - Current session display
  - Quick action buttons for all major functions
  
- **Locomotive Management**: Complete locomotive roster management
  - Full CRUD operations for locomotive fleet
  - Service status tracking (In Service/Out of Service)
  - Home yard assignments
  - Current location tracking
  - Advanced filtering and search
  - Train assignment validation
  
- **Session Management**: Operating session lifecycle
  - Track current operating session
  - Advance to next session with state snapshots
  - Rollback to previous session with full state restoration
  - Session description editing
  
- **Train Operations**: Complete train lifecycle management
  - Create, edit, and delete trains
  - Intelligent switch list generation
  - Car routing with capacity management
  - Train completion with automatic car movement
  - Train cancellation with order reversion
  - Status tracking (Planned → In Progress → Completed/Cancelled)
  
- **Car Order Management**: Industry demand and fulfillment
  - Generate orders based on industry demand configuration
  - Track order status (Pending → Assigned → Delivered)
  - Fulfillment rate monitoring
  - Advanced filtering and search
  
- **Route Management**: Complete route configuration
  - Station sequence builder
  - Route validation and visualization
  - Full CRUD operations
  
- **Car Management**: Full rolling stock operations
  - Advanced filtering and sorting
  - DataGrid with pagination
  - Manual car movement
  - Duplicate prevention
  
- **Industry Management**: Complete industry tracking
  - Car demand configuration
  - Current car locations
  - Goods tracking (received/to ship)
  - Track capacity monitoring
  
- **Data Import/Export**: JSON-based data management
  - Validation and error reporting
  - Clear database functionality
  - Custom ID preservation
  
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Data Grid**: @mui/x-data-grid

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: NeDB (file-based NoSQL)
- **Validation**: Joi
- **Architecture**: Repository Pattern, Service Layer, Middleware
- **Testing**: Jest (413 tests passing)

### Testing
- **Backend**: 413 comprehensive tests (100% pass rate)
- **Frontend**: 162 comprehensive tests (100% pass rate)
- **Total**: 575 tests ensuring quality and reliability

## 📋 Prerequisites

- Node.js 18+ and npm
- Git

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:MyTurnyet/elmrr-switch.git
   cd elmrr-switch
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Development

Run the backend and frontend servers concurrently:

**Terminal 1 - Backend** (runs on port 3001)
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend** (runs on port 5173)
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

### Testing

**Backend Tests** (413 tests)
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch         # Run in watch mode
```

**Frontend Tests** (162 tests)
```bash
cd frontend
npm test                    # Run all tests
npm test -- --watch         # Run in watch mode
```

**Frontend Build**
```bash
cd frontend
npm run build              # TypeScript + production build
npm run lint               # ESLint checks
```

## 📊 Initial Data Setup

The project includes seed data for quick setup:

1. Start both backend and frontend servers
2. Navigate to the **Data Import** page
3. Upload `data/seed/seed-data.json` or use the upload button
4. The system will import:
   - 13 stations
   - 29 industries (including 7 yards)
   - 217 rolling stock cars
   - Locomotives (if included in seed data)

## 📁 Project Structure

```
elmrr-switch/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── contexts/       # React Context providers
│   │   ├── types/          # TypeScript interfaces
│   │   ├── services/       # API service layer
│   │   └── theme/          # Material-UI theme
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Data validation schemas
│   │   ├── database/       # NeDB configuration
│   │   └── tests/          # Jest test suite
│   └── package.json
├── data/
│   └── seed/               # Seed data files
└── docs/                   # Documentation
```

## 🔌 API Endpoints

### Operating Sessions
- `GET /api/sessions/current` - Get current session
- `POST /api/sessions/advance` - Advance to next session
- `POST /api/sessions/rollback` - Rollback to previous session
- `PUT /api/sessions/current` - Update session description

### Trains
- `GET /api/trains` - List all trains with filtering
- `GET /api/trains/:id` - Get train by ID
- `POST /api/trains` - Create new train
- `PUT /api/trains/:id` - Update train (Planned only)
- `DELETE /api/trains/:id` - Delete train (Planned only)
- `POST /api/trains/:id/generate-switch-list` - Generate switch list
- `POST /api/trains/:id/complete` - Complete train
- `POST /api/trains/:id/cancel` - Cancel train

### Car Orders
- `GET /api/car-orders` - List all orders with filtering
- `GET /api/car-orders/:id` - Get order by ID
- `POST /api/car-orders` - Create new order
- `PUT /api/car-orders/:id` - Update order
- `DELETE /api/car-orders/:id` - Delete order (Pending only)
- `POST /api/car-orders/generate` - Generate orders from demand

### Routes
- `GET /api/routes` - List all routes
- `GET /api/routes/:id` - Get route by ID
- `POST /api/routes` - Create new route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Cars
- `GET /api/cars` - List all cars with optional filtering
- `GET /api/cars/:id` - Get car by ID
- `POST /api/cars` - Create new car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `POST /api/cars/:id/move` - Move car to new location

### Industries
- `GET /api/industries` - List all industries
- `GET /api/industries/:id` - Get industry by ID
- `POST /api/industries` - Create new industry
- `PUT /api/industries/:id` - Update industry
- `DELETE /api/industries/:id` - Delete industry

### Data Management
- `POST /api/import/json` - Import JSON data
- `GET /api/import/export` - Export all data to JSON
- `POST /api/import/clear` - Clear all database data

### Locomotives
- `GET /api/locomotives` - List all locomotives with filtering
- `GET /api/locomotives/:id` - Get locomotive by ID
- `POST /api/locomotives` - Create new locomotive
- `PUT /api/locomotives/:id` - Update locomotive
- `DELETE /api/locomotives/:id` - Delete locomotive
- `POST /api/locomotives/:id/toggle-service` - Toggle service status

### Other Resources
- `GET /api/stations` - List all stations
- `GET /api/goods` - List all goods
- `GET /api/aar-types` - List all AAR car types
- `GET /api/blocks` - List all blocks
- `GET /api/tracks` - List all tracks

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:

- [System Specification](docs/railroad-layout-spec.md) - Complete feature specification
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development roadmap and status

## 🧪 Testing

The project includes comprehensive test coverage across both backend and frontend:

### Backend (413 tests)
- Model validation tests (201 tests)
- API route integration tests
- Service layer unit tests
- Repository pattern tests
- Complex workflow integration tests
- Database layer tests (9 tests)

### Frontend (162 tests)
- Component unit tests
- Page integration tests
- Context provider tests
- API service tests
- User interaction tests

**Total: 575 tests ensuring quality and reliability**

Run tests:
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

## 🎯 Key Features Explained

### Custom ID Preservation
The system supports custom `_id` fields in import data, allowing human-readable identifiers like `"vancouver-yard"` instead of auto-generated IDs. This makes data relationships more maintainable.

### Import Dependency Ordering
The import system respects data dependencies:
1. Reference data (blocks, stations, goods, AAR types)
2. Industries (depend on stations)
3. Tracks (depend on industries)
4. Rolling stock (depend on industries)

### Responsive Design
All pages are fully responsive with breakpoints for:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 🚧 Known Limitations

- Maximum recommended: ~1000 cars (current: 217)
- Single-user system (multi-user support planned)
- File-based database (NeDB)

## 🗺️ Roadmap

### ✅ Phase 1 - COMPLETE
- [x] Dashboard with statistics
- [x] Car management (CRUD)
- [x] Industry management (CRUD)
- [x] Data import/export system

### ✅ Phase 2.1 - COMPLETE
- [x] Route management with station sequences

### ✅ Phase 2.2 - COMPLETE
- [x] Operating session management
- [x] Train operations with switch list generation
- [x] Car order system with demand configuration
- [x] Complete train lifecycle management

### Phase 3 (Future Enhancements)
- [ ] Advanced reporting and analytics
- [ ] Data visualization with charts
- [ ] Code splitting for performance
- [ ] E2E tests with Playwright
- [ ] Real-time updates with WebSockets
- [ ] Mobile app optimization (PWA)
- [ ] Integration with DCC systems
- [ ] JMRI integration

## 🤝 Contributing

This is currently a personal project, but suggestions and feedback are welcome through GitHub Issues.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Paige Watson**
- GitHub: [@MyTurnyet](https://github.com/MyTurnyet)

## 🙏 Acknowledgments

- Built with assistance from Claude Code
- Material-UI for the excellent component library
- The model railroad community for inspiration

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Current Status**: Phase 2.2 Complete ✅ | Full-stack application production-ready | 575 tests passing

*Last Updated: October 29, 2025*
