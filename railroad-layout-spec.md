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

- **Aar Types**
//These are the designations for car types
  - Properties: ID, name, initial, description

- **Rolling Stock**
  - Properties: ID, reporting marks, reporting number, car type, color, notes, current load, home yard, current industry, is in service, last moved, sessions count at current location

- **Trains**
  - Properties: ID, name, route, schedule, status, current cars, locomotives
  - 1-n Locomotives will be chosen manually from a list of locomotives
  - Locomotives can only be assigned to one train at a time
  - A train will exist only during a single operating session and will be deleted when the session is complete.

- **Routes**
  - Ordered list of stations
  - Properties: ID, name, description, station sequence
  - Originates from a yard
  - Terminates at a yard

- **Operating Sessions**
  - Properties: ID, date, description, current session number

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
- Switch list generation
- Train movement tracking
- Car pickup/setout management
- Cancel current "in progress" trains

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
- Roll back to previous session ability/cancel current session
- Add session planning features:
  - Pre-session car forwarding rules
  - Industry demand generation
  - Car distribution balancing
- Session documentation:
  - Session reports
  Car movement history
- Performance metrics

### 4.3 Data Management
- Import/export JSON data
- Backup/restore functionality
- Data validation on import

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
  - cars
  - locomotives
  - industries
  - stations
  - goods
  - aarTypes
  - trains
  - routes
  - operatingSessions

### 5.4 Testing
- Unit testing
- Integration testing
- End-to-end testing

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

### Phase 1: Core Functionality
- Basic data model implementation
- NeDB setup and data import
- Simple UI for car and industry management

### Phase 2: Operations
- Switch list generation
- Train operations
- Session management

### Phase 3: Enhanced Features
- Advanced reporting
- Data visualization
- Mobile optimization

## 7. Future Enhancements
- Integration with DCC systems
- Multi-user support
- Cloud synchronization
- Mobile app
- Integration with JMRI
- Support for Car Card Systems
- Multiple users and layouts