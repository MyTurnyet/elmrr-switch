# Phase 2.2 Frontend Implementation - Task List

**Created**: 2025-10-28T07:58:00-07:00  
**Status**: 🚀 Ready to Start  
**Estimated Effort**: 15-20 hours  
**Dependencies**: Backend complete ✅ (409/409 tests passing)

---

## Overview

Implement the frontend UI for Phase 2.2 Train Operations, including operating sessions, train management, and car order management. This will complete the train operations feature set and make the backend functionality accessible to users.

---

## Task Breakdown

### Task 1: TypeScript Interfaces & Types ✅ COMPLETE
**Estimated Time**: 1-2 hours  
**Actual Time**: 1.5 hours  
**Priority**: Critical (foundation for all other tasks)

**Subtasks:**
- [x] Add `OperatingSession` interface with all fields
- [x] Add `CarOrder` interface with status enum
- [x] Add `Train` interface with complex types
- [x] Add `SwitchList` and related nested types
- [x] Add `TrainStatus`, `OrderStatus` enums
- [x] Add `CarDemandConfig` type
- [x] Update existing interfaces (Industry with carDemandConfig)
- [x] Ensure id/_id dual support for all new types
- [x] Add comprehensive JSDoc comments
- [x] Create type validation tests (34 tests)
- [x] Configure vitest for frontend testing
- [x] All tests passing (34/34)

**Acceptance Criteria:**
- ✅ All new types compile without errors
- ✅ Types match backend API response structures exactly
- ✅ Enums match backend validation rules
- ✅ JSDoc comments for complex types
- ✅ 34 comprehensive type validation tests passing
- ✅ Test coverage for all new types and workflows

**Files Modified:**
- `frontend/src/types/index.ts` (added 200+ lines)
- `frontend/src/types/__tests__/trainOperations.types.test.ts` (new, 34 tests)
- `frontend/vitest.config.ts` (new)
- `frontend/src/test/setup.ts` (new)
- `frontend/package.json` (added test scripts)

---

### Task 2: API Service Methods ✅ COMPLETE
**Estimated Time**: 2-3 hours  
**Actual Time**: 1.5 hours  
**Priority**: Critical (required for AppContext)

**Subtasks:**
- [x] Update API_BASE_URL to use /api/v1 (versioned endpoints)
- [x] Add type imports from types/index
- [x] Add Routes API (5 methods: get, getById, create, update, delete)
- [x] Add Operating Sessions API (4 methods: getCurrent, advance, rollback, updateDescription)
- [x] Add Trains API (8 methods: CRUD + generateSwitchList, complete, cancel)
- [x] Add Car Orders API (6 methods: CRUD + generate)
- [x] Proper TypeScript typing for all methods
- [x] Query parameter handling with filters
- [x] Comprehensive test suite (35 tests)
- [x] All tests passing (35/35)
- [x] TypeScript compilation successful

**Acceptance Criteria:**
- ✅ All API methods properly typed with request/response types
- ✅ Error handling consistent with existing API methods
- ✅ Proper use of async/await
- ✅ Query parameter handling for filters
- ✅ 35 comprehensive API tests covering all methods
- ✅ Test coverage for success cases, error cases, and edge cases
- ✅ Mocked fetch for isolated testing

**Files Modified:**
- `frontend/src/services/api.ts` (+177 lines, 23 new methods)
- `frontend/src/services/__tests__/api.trainOperations.test.ts` (new, 35 tests)

---

### Task 3: AppContext Integration
**Estimated Time**: 2-3 hours  
**Priority**: Critical (required for all pages)

**Subtasks:**
- [ ] Add session state to AppContext
- [ ] Add trains state to AppContext
- [ ] Add carOrders state to AppContext
- [ ] Add loading states for each entity
- [ ] Add error states for each entity
- [ ] Implement `fetchCurrentSession()` method
- [ ] Implement `advanceSession()` method with optimistic updates
- [ ] Implement `rollbackSession()` method with state restoration
- [ ] Implement `fetchTrains()` method with filtering
- [ ] Implement `createTrain()` method
- [ ] Implement `updateTrain()` method
- [ ] Implement `deleteTrain()` method
- [ ] Implement `generateSwitchList()` method
- [ ] Implement `completeTrain()` method
- [ ] Implement `cancelTrain()` method
- [ ] Implement `fetchCarOrders()` method with filtering
- [ ] Implement `generateCarOrders()` method
- [ ] Add refresh methods for each entity
- [ ] Add error handling and user notifications

**Acceptance Criteria:**
- Context provides all necessary state and methods
- Loading states prevent race conditions
- Error handling shows user-friendly messages
- Optimistic updates for better UX
- State updates trigger re-renders correctly

**Files to Modify:**
- `frontend/src/contexts/AppContext.tsx`

---

### Task 4: SessionManagement Page
**Estimated Time**: 3-4 hours  
**Priority**: High (simplest page, validates integration)

**Subtasks:**
- [ ] Create `SessionManagement.tsx` page component
- [ ] Display current session information card
  - Session number
  - Session date
  - Description (editable)
  - Last updated timestamp
- [ ] Add "Advance Session" button with confirmation dialog
  - Show warning about permanent action
  - Display what will happen (car movements, train deletions)
  - Success/error feedback
- [ ] Add "Rollback Session" button with confirmation dialog
  - Show warning about data restoration
  - Display snapshot information
  - Disable if on session 1
  - Success/error feedback
- [ ] Add session history/statistics section
  - Total sessions
  - Current session duration
  - Recent session changes
- [ ] Add loading states during operations
- [ ] Add error handling with user-friendly messages
- [ ] Make responsive for mobile/tablet/desktop
- [ ] Add Material-UI styling consistent with existing pages

**Acceptance Criteria:**
- Session info displays correctly
- Advance session works and updates UI
- Rollback session works and restores state
- Confirmation dialogs prevent accidental actions
- Loading states show during async operations
- Error messages are clear and actionable
- Responsive design works on all screen sizes

**Files to Create:**
- `frontend/src/pages/SessionManagement.tsx`

---

### Task 5: TrainOperations Page
**Estimated Time**: 5-6 hours  
**Priority**: High (core feature, most complex)

**Subtasks:**
- [ ] Create `TrainOperations.tsx` page component
- [ ] Implement trains DataGrid
  - Columns: Name, Route, Session, Status, Locomotives, Capacity, Actions
  - Row actions: View, Edit, Delete, Generate Switch List, Complete, Cancel
  - Filtering by session, status, route
  - Search by name
  - Sorting support
- [ ] Create "Add Train" dialog
  - Train name input with validation
  - Route selection dropdown
  - Locomotive multi-select
  - Max capacity input
  - Validation and error handling
- [ ] Create "Edit Train" dialog
  - Same fields as Add (only if status = Planned)
  - Pre-populate with existing data
  - Disable if train is In Progress or Completed
- [ ] Create "Delete Train" confirmation dialog
  - Show train details
  - Warning message
  - Only allow if status = Planned
- [ ] Create "Switch List" display dialog
  - Station-by-station breakdown
  - Pickup/setout details per station
  - Car information (reporting marks, type, destination)
  - Print/export functionality (future: PDF)
  - Clear, railroad-appropriate formatting
- [ ] Implement "Generate Switch List" action
  - Confirmation dialog
  - Progress indicator
  - Success message with switch list display
  - Error handling (no cars available, capacity exceeded, etc.)
- [ ] Implement "Complete Train" action
  - Confirmation dialog
  - Show what will happen (car movements, order updates)
  - Success feedback
  - Only allow if status = In Progress
- [ ] Implement "Cancel Train" action
  - Confirmation dialog
  - Show impact (orders reverted to pending)
  - Success feedback
- [ ] Add train statistics cards
  - Total trains this session
  - Trains by status (Planned, In Progress, Completed, Cancelled)
  - Average capacity utilization
- [ ] Add status badge styling (color-coded by status)
- [ ] Make responsive for all screen sizes

**Acceptance Criteria:**
- DataGrid displays trains with proper formatting
- All CRUD operations work correctly
- Switch list generation works and displays properly
- Train completion moves cars and updates orders
- Train cancellation reverts orders correctly
- Status workflow enforced (can't edit In Progress trains, etc.)
- Loading states during async operations
- Error messages are clear and helpful
- Responsive design works on all devices

**Files to Create:**
- `frontend/src/pages/TrainOperations.tsx`

**Optional Components to Extract:**
- `frontend/src/components/TrainForm.tsx` (if dialog gets too large)
- `frontend/src/components/SwitchListDisplay.tsx` (for reusability)

---

### Task 6: CarOrderManagement Page
**Estimated Time**: 3-4 hours  
**Priority**: High (completes feature set)

**Subtasks:**
- [ ] Create `CarOrderManagement.tsx` page component
- [ ] Implement car orders DataGrid
  - Columns: Industry, AAR Type, Session, Status, Assigned Car, Assigned Train, Actions
  - Row actions: View, Delete (if pending)
  - Filtering by status, industry, session, AAR type
  - Search functionality
  - Sorting support
- [ ] Create "Generate Orders" button
  - Confirmation dialog showing industries with demand config
  - Force regeneration option (checkbox)
  - Display generation summary (orders created per industry/type)
  - Success/error feedback
- [ ] Create "View Order Details" dialog
  - Order information
  - Industry details
  - Car details (if assigned)
  - Train details (if assigned)
  - Status history
- [ ] Create "Configure Industry Demand" dialog
  - Industry selection
  - AAR type multi-select with demand config
  - For each type: carsPerSession, frequency inputs
  - Validation (positive numbers, no duplicates)
  - Save and apply
- [ ] Add car order statistics cards
  - Total orders this session
  - Orders by status (Pending, Assigned, In Transit, Delivered)
  - Fulfillment rate
- [ ] Add status badge styling (color-coded)
- [ ] Make responsive for all screen sizes

**Acceptance Criteria:**
- DataGrid displays orders with proper formatting
- Order generation works and shows summary
- Industry demand configuration works
- Order details display correctly
- Filtering and search work properly
- Statistics are accurate
- Loading states during async operations
- Error messages are clear
- Responsive design works on all devices

**Files to Create:**
- `frontend/src/pages/CarOrderManagement.tsx`

**Optional Components to Extract:**
- `frontend/src/components/DemandConfigForm.tsx` (if dialog gets too large)

---

### Task 7: Dashboard Integration
**Estimated Time**: 1-2 hours  
**Priority**: Medium (nice to have, improves UX)

**Subtasks:**
- [ ] Add "Current Session" info card to Dashboard
  - Session number
  - Quick advance/rollback buttons
- [ ] Add "Trains" statistics card
  - Total trains this session
  - Breakdown by status
  - Quick link to TrainOperations page
- [ ] Add "Car Orders" statistics card
  - Total orders this session
  - Pending orders count
  - Fulfillment rate
  - Quick link to CarOrderManagement page
- [ ] Update "Recent Activity" feed
  - Show session advances
  - Show train completions
  - Show order generations
- [ ] Update quick action buttons
  - Add "Create Train" button
  - Add "Generate Orders" button
  - Add "Advance Session" button

**Acceptance Criteria:**
- New cards display correct statistics
- Quick actions work properly
- Links navigate to correct pages
- Recent activity shows train operations events
- Layout remains responsive

**Files to Modify:**
- `frontend/src/pages/Dashboard.tsx`

---

### Task 8: Navigation & Routing
**Estimated Time**: 1 hour  
**Priority**: Critical (required to access new pages)

**Subtasks:**
- [ ] Add "Operations" section to navigation menu
  - "Session Management" menu item
  - "Train Operations" menu item
  - "Car Orders" menu item
- [ ] Add routes to App.tsx
  - `/session-management` → SessionManagement
  - `/train-operations` → TrainOperations
  - `/car-orders` → CarOrderManagement
- [ ] Update active state highlighting
- [ ] Add icons for new menu items (train, schedule, assignment icons)
- [ ] Ensure mobile menu includes new items

**Acceptance Criteria:**
- New menu items appear in navigation
- Routes work correctly
- Active state highlights current page
- Mobile menu includes new items
- Icons are appropriate and consistent

**Files to Modify:**
- `frontend/src/components/Layout.tsx`
- `frontend/src/App.tsx`

---

### Task 9: Testing & Refinement
**Estimated Time**: 2-3 hours  
**Priority**: High (ensures quality)

**Subtasks:**
- [ ] Manual testing of all workflows
  - Create train → generate switch list → complete train
  - Session advance with multiple trains
  - Session rollback and state restoration
  - Order generation with demand config
  - All CRUD operations
- [ ] Test error scenarios
  - Network failures
  - Validation errors
  - Business rule violations (can't edit In Progress train, etc.)
- [ ] Test responsive design
  - Mobile (320px - 768px)
  - Tablet (768px - 1024px)
  - Desktop (1024px+)
- [ ] Test with realistic data
  - Multiple trains in different states
  - Many car orders
  - Complex switch lists
- [ ] Performance testing
  - Large datasets (100+ trains, 500+ orders)
  - Rapid state changes
- [ ] Fix any bugs found
- [ ] Refine UI/UX based on testing
- [ ] Optimize performance if needed

**Acceptance Criteria:**
- All workflows work end-to-end
- Error handling is robust
- Responsive design works on all devices
- Performance is acceptable with realistic data
- No console errors or warnings
- UI is polished and professional

---

### Task 10: Documentation & Polish
**Estimated Time**: 1 hour  
**Priority**: Medium (important for maintainability)

**Subtasks:**
- [ ] Update README with new features
- [ ] Add JSDoc comments to complex functions
- [ ] Update current-status.md with frontend completion
- [ ] Add screenshots to documentation (optional)
- [ ] Update bundle size metrics
- [ ] Document any known limitations
- [ ] Add user guide section (optional)

**Acceptance Criteria:**
- Documentation is up to date
- Code is well-commented
- Status document reflects completion
- Future developers can understand the code

**Files to Modify:**
- `docs/current-status.md`
- `README.md`
- Various source files (comments)

---

## Success Criteria

### Functional Requirements
- ✅ All Phase 2.2 backend endpoints integrated
- ✅ Session management (advance/rollback) working
- ✅ Train lifecycle (create → plan → execute → complete) working
- ✅ Switch list generation and display working
- ✅ Car order generation and tracking working
- ✅ Industry demand configuration working

### Technical Requirements
- ✅ TypeScript compilation with no errors
- ✅ All API calls properly typed
- ✅ Error handling consistent across all pages
- ✅ Loading states prevent race conditions
- ✅ Responsive design on all screen sizes
- ✅ Performance acceptable with realistic data

### Quality Requirements
- ✅ Code follows existing patterns and conventions
- ✅ UI consistent with existing pages (Material-UI)
- ✅ User feedback for all actions (success/error messages)
- ✅ Confirmation dialogs for destructive actions
- ✅ Professional, railroad-appropriate terminology

---

## Dependencies

### External Dependencies
- Material-UI components (already installed)
- React Router (already installed)
- Existing AppContext pattern

### Internal Dependencies
- Backend API endpoints (all complete ✅)
- Existing type definitions
- Existing API service patterns
- Existing page layouts and components

---

## Risk Assessment

### Low Risk
- TypeScript interfaces (straightforward mapping from backend)
- API service methods (follow existing patterns)
- Navigation updates (simple additions)

### Medium Risk
- AppContext integration (complex state management)
- Switch list display (complex nested data structure)
- Train operations workflow (many edge cases)

### Mitigation Strategies
- Start with simplest page (SessionManagement) to validate integration
- Build incrementally, testing each feature before moving on
- Use existing patterns from Cars/Industries/Routes pages
- Comprehensive error handling to catch edge cases
- Manual testing with realistic scenarios

---

## Timeline Estimate

**Optimistic**: 15 hours (if everything goes smoothly)  
**Realistic**: 18-20 hours (accounting for debugging and refinement)  
**Pessimistic**: 25 hours (if significant issues arise)

**Recommended Approach**: Work in order of tasks 1-10, completing each fully before moving to the next. This ensures a solid foundation and allows for early validation of the integration.

---

## Notes

- Follow existing code patterns from CarManagement, IndustryView, and RouteManagement pages
- Use Material-UI components consistently with the rest of the app
- Maintain railroad-appropriate terminology (e.g., "switch list" not "task list")
- Consider extracting reusable components if dialogs become too large
- Keep performance in mind - use pagination for large datasets
- Test with realistic data volumes throughout development

---

**Ready to begin!** 🚂
