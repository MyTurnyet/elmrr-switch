# Model Railroad Layout Tracking System - Specification Document

## 1. System Overview
- Web-based application with responsive design for desktop and mobile
- Primary purpose: Track rolling stock, manage operations, and generate switch lists
- Data storage: NeDB with JSON import/export capabilities

## 2. Core Components

### 2.1 Data Model
- **Blocks**
  - Defines sections of the layout (both physical and virtual)
  - Properties: ID, name, yard ID, capacity, current cars'

- **Stations**
  - Physical on-layout stations
  - Virtual off-layout stations represented by a off-layout physical "Fiddle" yard
  - Properties: ID, name,block, type (station, yard, industry), description

- **Industries**
  - Belong to stations
  - Properties: ID, name, station ID, goods received, goods to ship, preferred car types
  - Special type: Yard (accepts all car types)
  - Industries can be on-layout or off-layout (virtual)


- **Tracks**
  - Belong to industries
  - Properties: ID, industry ID, capacity, current cars
  - Tracks can hold 1-n types of cars, including "all types"

- **Goods**
  - Properties: ID, name, compatible car types
  - Loading/unloading time (in operating sessions)

- **Locomotives**
  - Properties: ID, reporting marks, reporting number, type, color, notes, home yard, current industry, is in service
  - Full CRUD operations with validation
  - Service status tracking (In Service/Out of Service)
  - Train assignment validation (one locomotive per train)
  - Home yard assignments for routing

- **Aar Types**
//These are the designations for car types
  - Properties: ID, name, initial, description

- **Rolling Stock**
  - Properties: ID, reporting marks, reporting number, car type, color, notes, current load, home yard, current industry, is in service, last moved, sessions count at current location

- **Trains**
  - Properties: ID, name, route, schedule, status, current cars, locomotives
  - 1-n Locomotives will be chosen manually from a list of locomotives
  - Locomotives can only be assigned to one train at a time
  - A train will exist only during a single operating session and will be deleted when the session is complete
  - Status workflow: Planned → In Progress → Completed/Cancelled
  - Switch list generation with intelligent car routing
  - Capacity management and car assignment

- **Routes**
  - Ordered list of stations
  - Properties: ID, name, description, station sequence
  - Originates from a yard
  - Terminates at a yard

- **Operating Sessions**
  - Properties: ID, date, description, current session number
  - Session advancement with state snapshots
  - Rollback capability with full state restoration
  - Singleton pattern (one active session)
  - Automatic car location updates on session advance

- **Car Orders**
  - Properties: ID, industry ID, AAR type ID, session number, status, assigned car ID, assigned train ID
  - Status workflow: Pending → Assigned → In Transit → Delivered
  - Generated from industry demand configuration
  - Frequency-based demand scheduling

## 3. User Interface

### 3.1 Dashboard
- Overview of current layout state
- Quick access to key functions
- Session management controls

### 3.2 Car Management
- List view of all cars with filtering/sorting
- Car details and current status
- Manual car movement interface

### 3.3 Industry View
- List of industries and their current status
- Goods received/needed
- Manually update goods received/needed
- Current cars at each industry

### 3.4 Train Operations
- Switch list generation with intelligent routing
- Train movement tracking
- Car pickup/setout management
- Train completion with automatic car movement
- Cancel current "in progress" trains with order reversion
- Status tracking (Planned → In Progress → Completed/Cancelled)

### 3.6 Locomotive Management
- List view of all locomotives with filtering/sorting
- Locomotive details and current status
- Service status management (In Service/Out of Service)
- Home yard assignments
- Train assignment validation

### 3.5 Reporting
- Car movement history
- Car utilization
- Industry activity
- Train performance metrics
- Missing or underutilized goods

## 4. Key Features

### 4.1 Switch List Generation
- Automatically generates switch lists based on:
  - Train route
  - Car destinations
  - Car types and compatibility
  - Loading/unloading status
- Add detailed switch list fields:
  - Train identification (name/number, route, operating session number)
  - Origin and destination yards
  - Car movement instructions (pickup/setout)
  - Special handling notes
  - Space for crew signatures/check-offs
- Display switch list in a table
- Print switch list to PDF/Printer

### 4.2 Operating Session Management
- Track progress through operating sessions
- Advance time with "Next Session" button
- Update car statuses based on session progression
- Roll back to previous session ability with full state restoration
- Session planning features:
  - Industry demand generation with frequency controls
  - Car order generation based on demand configuration
  - Automatic car location updates on session advance
  - State snapshots for rollback capability
- Session documentation:
  - Session reports
  - Car movement history
  - Performance metrics

### 4.3 Data Management
- Import/export JSON data
- Clear database functionality with confirmation dialog
- Backup/restore functionality
- Data validation on import
- Support for custom _id fields to preserve human-readable identifiers
- Proper import order respecting data dependencies (stations → industries → cars)

## 5. Technical Specifications

### 5.1 Frontend
- Framework: Vite + React.js with TypeScript
- Testing: Vitest + React Testing Library
- UI Library: Material-UI for responsive components
- State Management: React Context
- Charting: Recharts for data visualization

### 5.2 Backend
- Runtime: Node.js
- Database: NeDB
- API: RESTful
- Authentication: Simple token-based (if multi-user needed)

### 5.3 Data Storage
- NeDB collections:
  - cars (with custom _id support for imports)
  - locomotives (with custom _id support for imports)
  - industries (with custom _id support for imports)
  - stations
  - goods
  - aarTypes
  - blocks
  - tracks
  - trains
  - routes
  - operatingSessions
  - carOrders
- Custom _id fields preserved when provided in import data
- Human-readable IDs for industries (e.g., "vancouver-yard", "walla-walla-yard")
- Performance indexes on frequently queried fields

### 5.4 Testing
- Unit testing (201 model tests)
- Integration testing (route and workflow tests)
- Database layer testing (9 tests)
- Frontend component testing (162 tests)
- Total: 575 tests with 100% pass rate

### 5.5 Performance
- Scaling
    - With only 300+/- cars, the system should be able to handle the load. This will ramp up if the system is opened to other users.
- Caching
    - Some data should be cached to improve performance.

### 5.5 Documentation
- User manual
- API documentation
- Example scenarios

## 6. Implementation Phases

### Phase 1: Core Functionality ✅ COMPLETE
- Basic data model implementation
- NeDB setup with proper import ordering
- Data import with validation and custom _id support
- Clear database functionality
- Full CRUD UI for car and industry management
- Dashboard with stats and quick actions
- Responsive Material-UI interface

### Phase 2.1: Route Management ✅ COMPLETE
- Route creation with station sequences
- Origin and termination yard validation
- Route visualization and editing

### Phase 2.2: Train Operations ✅ COMPLETE
- Operating session management with snapshots
- Train lifecycle management (Planned → In Progress → Completed/Cancelled)
- Intelligent switch list generation
- Car order system with demand configuration
- Train completion with automatic car movement
- Session advancement and rollback capabilities
- Locomotive management with full CRUD operations

### Phase 3: Enhanced Features
- Advanced reporting
- Data visualization
- Mobile optimization

## 7. Future Enhancements (Phase 3)
- Advanced reporting and analytics
- Data visualization with charts
- Code splitting for performance optimization
- E2E tests with Playwright
- Real-time updates with WebSockets
- Mobile app optimization (PWA)
- Integration with DCC systems
- Multi-user support
- Cloud synchronization
- Integration with JMRI
- Support for Car Card Systems
- Multiple users and layouts