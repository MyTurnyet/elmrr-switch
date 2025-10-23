# Phase 2.2: Train Operations - Detailed Implementation

**Status**: ⏳ PENDING

## Overview
This phase builds on Phase 2.1 routes to enable realistic railroad operations. The system will track operating sessions, generate car orders based on industry demand, create trains that fulfill those orders, and produce printable switch lists for train crews.

## Goal
Implement complete train operations workflow including operating sessions, car order management, train creation with switch list generation, and session progression with rollback capability.

## Key Concepts
- **Operating Session**: Single active session tracking current session number, with snapshot of previous session for rollback
- **Car Orders**: Industry demand for specific car types (e.g., "Lumber Mill needs 2 flatcars per session")
- **Trains**: Created with route, locomotives, and capacity; progress through Planned → In Progress → Completed → Cancelled states
- **Switch List**: Station-by-station pickup/setout instructions generated automatically based on car routing algorithm
- **Session Progression**: "Next Session" advances time, updates car statuses, deletes completed trains, generates new car orders
- **Rollback**: Restore previous session state with full car location and train restoration

## Backend Implementation

### 1. Operating Session Model & API ✅ COMPLETE
- [x] Create `backend/src/models/operatingSession.js` with Joi schema
  - Fields: currentSessionNumber (integer, required, default: 1)
  - Fields: sessionDate (ISO date string, auto-set to current date)
  - Fields: description (optional string, max 500 chars)
  - Fields: previousSessionSnapshot (object, stores complete state for rollback)
    - Snapshot contains: sessionNumber, cars (locations), trains, carOrders
  - Validation: currentSessionNumber >= 1
  - Note: Only ONE operating session record exists (singleton pattern)
- [x] Create `backend/src/routes/operatingSessions.js` with endpoints:
  - GET /api/sessions/current - Get current session info
  - POST /api/sessions/advance - Advance to next session (increment counter, create snapshot, update cars, delete completed trains, generate new car orders)
  - POST /api/sessions/rollback - Rollback to previous session (restore snapshot, decrement counter)
  - PUT /api/sessions/current - Update session description
- [x] Implement session advancement logic:
  - Create snapshot of current state (session number, all car locations, all trains, all car orders)
  - Increment currentSessionNumber
  - Update all cars: increment sessionsAtCurrentLocation counter
  - Delete all trains with status "Completed"
  - Revert cars from "In Progress" or "Planned" trains to their previous locations (from snapshot)
  - Generate new car orders based on industry demand configurations
  - Update sessionDate to current date
- [x] Implement rollback logic:
  - Validate previousSessionSnapshot exists (cannot rollback session 1)
  - Restore all car locations from snapshot
  - Restore all trains from snapshot (delete current trains, recreate previous)
  - Restore all car orders from snapshot
  - Decrement currentSessionNumber
  - Clear previousSessionSnapshot (can only rollback once)
- [x] Add session initialization on first server start:
  - Check if operating session exists, if not create with sessionNumber: 1
- [x] Create comprehensive unit tests (51 tests total)
  - Test session advancement (snapshot creation, car updates, train deletion)
  - Test rollback (state restoration, validation)
  - Test edge cases (rollback on session 1, multiple advances)
  - Model tests: 28 tests covering validation, snapshot creation
  - Route tests: 23 tests covering API endpoints, error handling

### 2. Car Order Model & API
- [ ] Create `backend/src/models/carOrder.js` with Joi schema
  - Fields: industryId (string, required, references Industry)
  - Fields: aarTypeId (string, required, references AarType)
  - Fields: sessionNumber (integer, required, session when order created)
  - Fields: status (enum: 'pending' | 'assigned' | 'in-transit' | 'delivered', default: 'pending')
  - Fields: assignedCarId (string, optional, references Rolling Stock)
  - Fields: assignedTrainId (string, optional, references Train)
  - Fields: createdAt (ISO date string, auto-set)
  - Validation: industryId must exist, aarTypeId must exist
  - Support custom _id for seed data
- [ ] Create `backend/src/routes/carOrders.js` with CRUD endpoints:
  - GET /api/car-orders - List all orders with filtering (industryId, status, sessionNumber, aarTypeId)
  - GET /api/car-orders/:id - Get single order
  - POST /api/car-orders - Create new order (manual creation)
  - PUT /api/car-orders/:id - Update order (status, assigned car/train)
  - DELETE /api/car-orders/:id - Delete order
  - POST /api/car-orders/generate - Generate orders for current session based on industry demand
- [ ] Implement order generation logic:
  - Query all industries with carDemandConfig
  - For each demand config entry, check if demand should be generated this session:
    - Use formula: (currentSessionNumber % frequency) === 0
    - Example: frequency=2 means every other session (sessions 2, 4, 6...)
  - Create carOrder records with status 'pending'
  - Return count of orders generated
- [ ] Add validation middleware:
  - Prevent duplicate orders (same industry + aarType + session + status=pending)
  - Validate assigned car matches aarType when assigning
- [ ] Create comprehensive unit tests (25+ tests)
  - Test order generation with various frequencies
  - Test order assignment validation
  - Test filtering and status updates

### 3. Industry Demand Configuration
- [ ] Update `backend/src/models/industry.js` to add optional field:
  - carDemandConfig: array of { aarTypeId: string, carsPerSession: number, frequency: number }
  - Example: `[{ aarTypeId: "flatcar", carsPerSession: 2, frequency: 1 }, { aarTypeId: "hopper", carsPerSession: 1, frequency: 2 }]`
  - Validation: aarTypeId must reference valid AAR type, carsPerSession >= 1, frequency >= 1
  - Default: empty array (no demand)
- [ ] Update industry CRUD endpoints to support carDemandConfig field
- [ ] Update industry tests to cover demand configuration validation
- [ ] Update import/export to include carDemandConfig

### 4. Train Model & API
- [ ] Create `backend/src/models/train.js` with Joi schema
  - Fields: name (string, required, max 100 chars, unique per session)
  - Fields: routeId (string, required, references Route)
  - Fields: sessionNumber (integer, required, session when train created)
  - Fields: status (enum: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled', default: 'Planned')
  - Fields: locomotiveIds (array of strings, required, min 1, references Locomotives)
  - Fields: maxCapacity (integer, required, min 1, max 100, represents max cars)
  - Fields: switchList (object, optional, generated when status changes to 'In Progress')
    - Structure: { stations: [{ stationId, stationName, pickups: [...], setouts: [...] }] }
  - Fields: assignedCarIds (array of strings, car IDs assigned to this train)
  - Fields: createdAt, updatedAt (ISO date strings)
  - Validation: routeId must exist, locomotiveIds must exist and not be assigned to other active trains
  - Support custom _id for seed data
- [ ] Create `backend/src/routes/trains.js` with CRUD endpoints:
  - GET /api/trains - List all trains with filtering (sessionNumber, status, routeId)
  - GET /api/trains/:id - Get single train with full switch list
  - POST /api/trains - Create new train (status: Planned)
  - PUT /api/trains/:id - Update train (name, locos, capacity - only if status=Planned)
  - DELETE /api/trains/:id - Delete train (only if status=Planned)
  - POST /api/trains/:id/generate-switch-list - Generate switch list (status: Planned → In Progress)
  - POST /api/trains/:id/complete - Mark train as completed (status: In Progress → Completed, update car locations)
  - POST /api/trains/:id/cancel - Cancel train (status: any → Cancelled, revert car locations if needed)
- [ ] Implement switch list generation algorithm:
  - Input: train (with route, capacity)
  - Get route with full station sequence (origin → stations → termination)
  - For each station along route:
    - Find pending car orders at industries in this station
    - Find available cars at this station matching order types
    - Assign cars to orders (up to train capacity)
    - Track pickups and setouts per station
    - Consider cars already on train for setouts at later stations
  - Additional logic:
    - Prioritize cars being routed to their home yard
    - Pick up cars even if no order exists (route to home yard or another industry)
    - Respect train capacity (current cars on train + pickups - setouts <= maxCapacity)
  - Output: switchList object with station-by-station instructions
  - Update carOrders: status pending → assigned, set assignedCarId and assignedTrainId
  - Update train: set switchList, assignedCarIds, status → In Progress
- [ ] Implement train completion logic:
  - Validate train status is "In Progress"
  - For each car in assignedCarIds, update car.currentIndustry to destination from switch list
  - Update carOrders assigned to this train: status assigned/in-transit → delivered
  - Update train status → Completed
  - Reset car.sessionsAtCurrentLocation to 0 for moved cars
- [ ] Implement train cancellation logic:
  - If status is "In Progress", revert car locations to pre-train state
  - Update carOrders: status assigned/in-transit → pending, clear assignedCarId/trainId
  - Update train status → Cancelled
- [ ] Add validation middleware:
  - Prevent locomotive assignment conflicts (loco can't be on multiple active trains)
  - Validate train name uniqueness within session
  - Prevent status changes if invalid (e.g., can't complete a Planned train)
- [ ] Create comprehensive unit tests (35+ tests)
  - Test train creation and validation
  - Test switch list generation algorithm with various scenarios
  - Test train completion and car movement
  - Test cancellation and rollback
  - Test locomotive assignment conflicts

### 5. Backend Testing & Integration
- [ ] Run all backend tests (expect 250+ tests total)
- [ ] Test session advancement with multiple trains
- [ ] Test rollback with complex state (multiple trains, car movements)
- [ ] Test switch list generation with edge cases:
  - Train with no available cars
  - Train with capacity constraints
  - Route with no pending orders
  - Cars routing to home yard
- [ ] Integration test: full session workflow (create orders → create train → generate list → complete → advance session → rollback)

### 6. Import/Export Support
- [ ] Update `backend/src/routes/import.js`:
  - Add operatingSessions to import (Step 1, before everything else)
  - Add carOrders to import (Step 5, after routes)
  - Add trains to import (Step 6, after carOrders)
  - Validate references during import
  - Support custom _id fields
- [ ] Add to export functionality (GET /api/import/export)
- [ ] Add to clear operation (POST /api/import/clear)
- [ ] Add import tests for new collections

### 7. Seed Data
- [ ] Update `data/seed/seed-data.json`:
  - Add operatingSession record (sessionNumber: 1, no snapshot)
  - Add 2-3 industries with carDemandConfig examples
  - Add 5-10 sample carOrders (mix of pending/assigned statuses)
  - Add 1-2 sample trains (one Planned, one Completed from previous session)
  - Use human-readable _id values
- [ ] Validate all references in seed data
- [ ] Test import successfully loads all new data

## Frontend Implementation

### 8. Context Integration
- [ ] Update `frontend/src/types/index.ts`:
  - Add OperatingSession interface (currentSessionNumber, sessionDate, description, previousSessionSnapshot)
  - Add CarOrder interface (all fields from backend model)
  - Add Train interface (all fields including switchList structure)
  - Add SwitchListStation, SwitchListPickup, SwitchListSetout interfaces
  - Add to AppContextType: currentSession, carOrders, trains
  - Add methods: advanceSession(), rollbackSession(), createTrain(), updateTrain(), deleteTrain(), generateSwitchList(), completeTrain(), cancelTrain(), createCarOrder(), updateCarOrder(), deleteCarOrder()
- [ ] Update `frontend/src/contexts/AppContext.tsx`:
  - Add state: currentSession, carOrders, trains
  - Add to fetchData(): fetch current session, car orders, trains
  - Implement all new context methods with API calls
  - Add reducer actions: SET_SESSION, SET_CAR_ORDERS, ADD_CAR_ORDER, UPDATE_CAR_ORDER, DELETE_CAR_ORDER, SET_TRAINS, ADD_TRAIN, UPDATE_TRAIN, DELETE_TRAIN
- [ ] Verify frontend builds with no TypeScript errors

### 9. Operating Session Management UI
- [ ] Create `frontend/src/pages/SessionManagement.tsx`:
  - Display current session info card:
    - Session number (large, prominent)
    - Session date
    - Description (editable inline)
    - Stats: active trains, pending orders, completed trains
  - Action buttons:
    - "Advance to Next Session" (primary button, with confirmation dialog)
    - "Rollback to Previous Session" (warning button, with BIG warning dialog)
    - "Edit Description" (icon button)
  - Session history section (read-only, shows previous session info if snapshot exists)
  - Recent activity feed (trains completed, orders fulfilled this session)
- [ ] Implement advance session confirmation dialog:
  - Warning: "This will increment the session counter and update all car statuses"
  - Show impact preview: X trains will be deleted, Y cars will update
  - Confirm/Cancel buttons
  - On confirm: call advanceSession(), show loading state, refresh data
- [ ] Implement rollback confirmation dialog:
  - BIG WARNING: "This will restore the previous session state and cannot be undone!"
  - Show what will be restored: session number, car count, train count
  - Red "Rollback Session" button + "Cancel"
  - Disable if no previous snapshot exists
  - On confirm: call rollbackSession(), show loading state, refresh data
- [ ] Add to navigation menu (icon: CalendarToday or Event)
- [ ] Responsive design with grid layouts

### 10. Car Order Management UI
- [ ] Create `frontend/src/pages/CarOrderManagement.tsx`:
  - DataGrid with car orders (pagination: 10/25/50/100)
  - Columns: Industry, Car Type, Session, Status, Assigned Car, Assigned Train, Actions
  - Status chips with color coding (pending=grey, assigned=blue, in-transit=orange, delivered=green)
  - Filtering: industry, status, session number, car type
  - Search by industry name
  - Real-time stats: total orders, pending, assigned, delivered
  - Actions: View/Edit/Delete (only for pending orders)
  - "Generate Orders" button (calls POST /api/car-orders/generate)
  - "Add Manual Order" button (opens form dialog)
- [ ] Implement add/edit car order dialog:
  - Dropdown: Industry (required)
  - Dropdown: AAR Type (required)
  - Display: Session number (read-only, current session)
  - Status display (read-only for edit mode)
  - Save/Cancel buttons
- [ ] Implement delete confirmation dialog
- [ ] Add to navigation menu (icon: Assignment or ListAlt)

### 11. Industry Demand Configuration UI
- [ ] Update `frontend/src/pages/IndustryView.tsx`:
  - Add "Demand Config" section to industry detail dialog
  - Display current demand configuration as table:
    - Columns: Car Type, Cars Per Session, Frequency (every N sessions)
  - Add "Edit Demand" button (opens demand config dialog)
- [ ] Create demand configuration dialog:
  - List of demand entries with add/remove capability
  - Per entry: AAR Type dropdown, Cars Per Session input, Frequency input
  - Validation: carsPerSession >= 1, frequency >= 1
  - Save updates industry.carDemandConfig
- [ ] Update industry edit form to include demand config section

### 12. Train Management UI
- [ ] Create `frontend/src/pages/TrainOperations.tsx`:
  - DataGrid with trains (pagination: 10/25/50/100)
  - Columns: Name, Route, Session, Status, Locomotives, Capacity, Car Count, Actions
  - Status chips with color coding (Planned=grey, In Progress=blue, Completed=green, Cancelled=red)
  - Filtering: session number, status, route
  - Search by train name
  - Real-time stats: total trains, in progress, completed this session
  - Actions per row: View/Edit/Delete (Planned), View/Complete/Cancel (In Progress), View (Completed/Cancelled)
  - "Create Train" button (opens train creation wizard)
  - Group by session number (collapsible sections)
- [ ] Implement train creation wizard (two-step dialog):
  - Step 1: Basic Info
    - Train name input (required, unique per session)
    - Route dropdown (required, from Phase 2.1 routes)
    - Locomotive selection (multi-select, required, min 1)
      - Show only locomotives not assigned to other active trains
      - Display loco reporting marks and type
    - Max capacity input (required, 1-100)
    - "Next" button
  - Step 2: Review & Create
    - Display summary of train info
    - Show route path (origin → stations → destination)
    - Show selected locomotives
    - "Create Train" button (status: Planned)
    - "Back" button to edit
  - On create: call createTrain(), close dialog, refresh data
- [ ] Implement train detail dialog (read-only):
  - Display train name, route, session, status
  - Show locomotives assigned
  - Show capacity and current car count
  - If status is "In Progress" or "Completed", display full switch list (see step 13)
  - Action buttons based on status:
    - Planned: "Generate Switch List", "Edit Train", "Delete Train"
    - In Progress: "View Switch List", "Complete Train", "Cancel Train"
    - Completed/Cancelled: "View Switch List" only
- [ ] Implement edit train dialog (only for Planned trains):
  - Same fields as creation wizard
  - Can modify name, locos, capacity
  - Cannot modify route or session
- [ ] Implement delete confirmation (only for Planned trains)
- [ ] Add to navigation menu (icon: Train or DirectionsRailway)

### 13. Switch List Generation & Display
- [ ] Implement "Generate Switch List" action:
  - Confirmation dialog: "Generate switch list for train [name]?"
  - Show preview: route path, available cars, estimated car count
  - On confirm: call POST /api/trains/:id/generate-switch-list
  - Show loading state during generation
  - On success: update train status to "In Progress", open switch list view
  - On error: show error message (e.g., "No available cars found")
- [ ] Create switch list view dialog:
  - Header section:
    - Train name and number (large, prominent)
    - Route: Origin → Destination
    - Locomotives: reporting marks and types
    - Session number
    - "Assigned to: _____________" line (blank for crew to fill in)
  - Station-by-station instructions:
    - For each station in route:
      - Station name header (bold, large)
      - Pickups section (if any):
        - Checkbox per car (for crew to mark)
        - Car reporting marks and number
        - Car type (AAR type)
        - Destination industry
      - Setouts section (if any):
        - Checkbox per car
        - Car reporting marks and number
        - Car type
        - Final destination (this industry)
  - Footer:
    - Total cars picked up
    - Total cars set out
    - Final car count
  - Action buttons:
    - "Print Switch List" (opens print dialog)
    - "Export to PDF" (generates PDF)
    - "Close"
- [ ] Implement PDF generation:
  - Use library: jsPDF or react-pdf
  - Format: Letter size (8.5" x 11")
  - Include all switch list information
  - Checkboxes rendered as empty squares
  - Professional railroad-style formatting
  - Print-friendly (black & white, clear fonts)
- [ ] Implement print functionality:
  - Use browser print dialog
  - CSS print styles for clean output
  - Hide UI buttons in print view

### 14. Train Completion & Cancellation
- [ ] Implement "Complete Train" action:
  - Confirmation dialog: "Mark train [name] as completed?"
  - Warning: "This will update all car locations to their destinations"
  - Show summary: X cars will be moved
  - On confirm: call POST /api/trains/:id/complete
  - Show loading state
  - On success: update train status to "Completed", refresh car data
  - Success message: "Train completed! All cars have been moved to their destinations."
- [ ] Implement "Cancel Train" action:
  - Confirmation dialog: "Cancel train [name]?"
  - Warning: "This will revert any car assignments and mark the train as cancelled"
  - Red "Cancel Train" button + "Keep Train"
  - On confirm: call POST /api/trains/:id/cancel
  - On success: update train status to "Cancelled", refresh data

### 15. Dashboard Integration
- [ ] Update `frontend/src/pages/Dashboard.tsx`:
  - Update "System Status" card to show current session number
  - Add "Active Trains" stat (count of In Progress trains)
  - Add "Pending Orders" stat (count of pending car orders)
  - Update recent activity to include:
    - "Session X started on [date]"
    - "Train [name] completed"
    - "X car orders generated"
  - Add quick action buttons:
    - "Manage Session" → SessionManagement
    - "Create Train" → TrainOperations
    - "View Orders" → CarOrderManagement
  - Add session info banner at top (if session > 1, show "Operating Session X")

### 16. Navigation & Routing
- [ ] Update `frontend/src/App.tsx`:
  - Add routes: /session → SessionManagement
  - Add routes: /trains → TrainOperations
  - Add routes: /car-orders → CarOrderManagement
  - Update navigation menu order: Dashboard, Cars, Industries, Routes, Trains, Car Orders, Session, Data Import
- [ ] Update `frontend/src/components/Layout.tsx`:
  - Add menu items with appropriate icons
  - Group operations-related items (Trains, Car Orders, Session)
  - Active highlighting

### 17. Type Safety & Error Handling
- [ ] Ensure all components use proper TypeScript types
- [ ] Implement comprehensive error handling:
  - API call failures (network errors, validation errors)
  - Invalid state transitions (e.g., completing a Planned train)
  - Rollback failures (no snapshot exists)
  - Switch list generation failures (no cars available)
- [ ] Add loading states for all async operations
- [ ] User-friendly error messages with actionable guidance

## Testing & Quality Assurance

### 18. Frontend Testing
- [ ] Manual testing checklist:
  - Create operating session and advance through multiple sessions
  - Test rollback functionality with warning dialog
  - Create car orders manually and via generation
  - Configure industry demand and verify order generation
  - Create train (Planned status)
  - Generate switch list (verify algorithm correctness)
  - View and print switch list
  - Complete train and verify car movements
  - Cancel train and verify reversion
  - Test session advancement with active trains (should revert)
  - Test all filters and search across all pages
  - Verify responsive design on mobile/tablet/desktop
- [ ] Test edge cases:
  - Rollback on session 1 (should be disabled)
  - Generate switch list with no available cars
  - Train capacity constraints
  - Locomotive assignment conflicts
  - Multiple trains on same route

### 19. Build & Performance
- [ ] Run frontend build: `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Check bundle size (expect ~1,100-1,200 KB with PDF library)
- [ ] Run backend tests: `npm test` (expect 250+ tests passing)
- [ ] Performance testing:
  - Test with 50+ car orders
  - Test with 10+ active trains
  - Test switch list generation with complex routes
  - Verify DataGrid performance

### 20. Documentation
- [ ] Update IMPLEMENTATION_PLAN.md:
  - Mark Phase 2.2 tasks as completed
  - Document API endpoints
  - Update known issues and current status
- [ ] Update README.md:
  - Add Phase 2.2 features to feature list
  - Update screenshots (if applicable)
  - Document operating session workflow
- [ ] Create user guide section:
  - How to configure industry demand
  - How to create and run trains
  - How to use switch lists
  - How to manage operating sessions

## Success Criteria
- [ ] Backend APIs fully functional (sessions, car orders, trains)
- [ ] All backend tests passing (250+ tests)
- [ ] Operating session management UI complete with advance/rollback
- [ ] Car order management UI with generation and manual creation
- [ ] Industry demand configuration working
- [ ] Train creation wizard functional
- [ ] Switch list generation algorithm working correctly
- [ ] Switch list display with station-by-station format
- [ ] PDF export and print functionality working
- [ ] Train completion updates car locations correctly
- [ ] Session advancement creates snapshot and updates state
- [ ] Rollback restores previous session accurately
- [ ] All pages accessible from navigation menu
- [ ] Dashboard shows session and train statistics
- [ ] Responsive design working on all screen sizes
- [ ] No TypeScript errors in frontend build
- [ ] Clean, professional UI following Material-UI patterns

**Estimated Effort**: 20-30 hours  
**Priority**: High - Core operations functionality  
**Dependencies**: Phase 2.1 (Routes) must be complete
