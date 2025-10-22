# ELMRR Switch - Model Railroad Layout Tracking System

A comprehensive web-based application for managing model railroad operations, tracking rolling stock, and generating switch lists. Built with modern web technologies for desktop and mobile use.

[![CI](https://github.com/MyTurnyet/elmrr-switch/actions/workflows/ci.yml/badge.svg)](https://github.com/MyTurnyet/elmrr-switch/actions/workflows/ci.yml)
[![Phase 1 Complete](https://img.shields.io/badge/Phase%201-Complete-success)](docs/IMPLEMENTATION_PLAN.md)
[![Tests](https://img.shields.io/badge/tests-102%20passing-success)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()

## 🚂 Features

### Current (Phase 1 - Complete)

- **Dashboard**: Overview with quick stats and recent activity
- **Car Management**: Full CRUD operations for rolling stock
  - Advanced filtering and sorting
  - DataGrid with pagination
  - Manual car movement
  - Duplicate prevention
- **Industry Management**: Complete industry tracking
  - Current car locations
  - Goods tracking (received/to ship)
  - Track capacity monitoring
  - Full CRUD operations
- **Data Import/Export**: JSON-based data management
  - Validation and error reporting
  - Clear database functionality
  - Custom ID preservation for human-readable identifiers
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Coming Soon (Phase 2)

- Switch list generation
- Train operations management
- Operating session tracking
- Route management

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
- **Testing**: Jest (102 tests passing)

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

**Backend Tests**
```bash
cd backend
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

### Other Resources
- `GET /api/stations` - List all stations
- `GET /api/locomotives` - List all locomotives
- `GET /api/goods` - List all goods
- `GET /api/aar-types` - List all AAR car types
- `GET /api/blocks` - List all blocks
- `GET /api/tracks` - List all tracks

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:

- [System Specification](docs/railroad-layout-spec.md) - Complete feature specification
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development roadmap and status

## 🧪 Testing

The backend includes comprehensive test coverage:
- **102 tests** covering all API routes
- Unit tests for data validation
- Integration tests for CRUD operations
- Import/export functionality tests

Run tests: `cd backend && npm test`

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

### Phase 2 (Next)
- [ ] Switch list generation
- [ ] Train operations and management
- [ ] Operating session tracking
- [ ] Route management

### Phase 3 (Future)
- [ ] Advanced reporting and analytics
- [ ] Data visualization with charts
- [ ] Mobile app optimization
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

**Current Status**: Phase 1 Complete ✅ | All core functionality working | Ready for Phase 2 development

*Last Updated: October 22, 2025*
