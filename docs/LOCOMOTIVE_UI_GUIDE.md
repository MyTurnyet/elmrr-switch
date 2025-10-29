# Locomotive Management UI Implementation Guide

**Last Updated**: 2025-10-29  
**Status**: Backend Complete - Frontend Implementation Guide

## Overview

This guide provides instructions for implementing the Locomotive Management UI. The backend is fully implemented with 8 REST endpoints ready for frontend integration.

---

## How to Add a Locomotive (Current Methods)

### Method 1: Using curl (Command Line)

```bash
curl -X POST http://localhost:3001/api/v1/locomotives \
  -H "Content-Type: application/json" \
  -d '{
    "reportingMarks": "ELMR",
    "reportingNumber": "005001",
    "model": "GP40",
    "manufacturer": "Atlas",
    "isDCC": true,
    "dccAddress": 5001,
    "homeYard": "high-bridge-yard",
    "isInService": true,
    "notes": "New locomotive"
  }'
```

### Method 2: Using the Import System

Add to `/data/seed/seed-data.json` in the `locomotives` array and use DataImport page.

### Method 3: Using Postman or API Tool

POST to `http://localhost:3001/api/v1/locomotives` with JSON body.

---

## Required Fields & Validation

### Required Fields
- **reportingMarks**: 1-10 characters (e.g., "ELMR", "UP")
- **reportingNumber**: Exactly 6 characters (e.g., "003801")
- **model**: 1-50 characters (e.g., "GP38-2")
- **manufacturer**: From approved list (see below)
- **isDCC**: Boolean
- **dccAddress**: Required if isDCC=true, range 1-9999
- **homeYard**: Valid yard ID
- **isInService**: Boolean (default: true)
- **notes**: Optional, max 500 characters

### Approved Manufacturers
Atlas, Kato, Lionel, Bachmann, Athearn, Walthers, Broadway Limited, MTH, Rapido

### Validation Rules
1. Reporting Marks + Number must be unique
2. DCC Address must be unique (for DCC locomotives)
3. Reporting Number must be exactly 6 characters
4. Home Yard must exist, be a yard, and be on layout

---

## Backend API Reference

Base URL: `http://localhost:3001/api/v1`

### 1. List Locomotives
```
GET /locomotives?manufacturer=Atlas&isInService=true&view=list
```

### 2. Get Statistics
```
GET /locomotives/statistics
```

### 3. Get Available Locomotives
```
GET /locomotives/available
```

### 4. Get Single Locomotive
```
GET /locomotives/:id
```

### 5. Check Train Assignments
```
GET /locomotives/:id/assignments
```

### 6. Create Locomotive
```
POST /locomotives
```

### 7. Update Locomotive
```
PUT /locomotives/:id
```

### 8. Delete Locomotive
```
DELETE /locomotives/:id
```

---

## Frontend Implementation Plan

### Page Structure
Follow the pattern of CarManagement, IndustryView, and RouteManagement pages.

**File:** `frontend/src/pages/LocomotiveManagement.tsx`

### Key Features

1. **DataGrid Display**
   - Sortable, filterable table
   - Columns: Marks, Number, Model, Manufacturer, DCC Status, Home Yard, Service Status
   - Action buttons: View, Edit, Delete

2. **Statistics Dashboard**
   - Total, In Service, Out of Service
   - DCC/DC counts
   - Availability rate

3. **Add Locomotive Dialog**
   - Form with validation
   - Manufacturer dropdown
   - Home yard dropdown
   - DCC configuration section

4. **Edit Locomotive Dialog**
   - Pre-populated form
   - Same validation as add

5. **View Details Dialog**
   - Read-only display
   - Show enriched data
   - Show train assignments

6. **Delete Confirmation**
   - Check train assignments
   - Prevent if assigned

7. **Advanced Filtering**
   - Search, manufacturer, model, yard, service status, DCC status

---

## Implementation Steps

### Step 1: Add TypeScript Interfaces

**File:** `frontend/src/types/index.ts`

```typescript
export interface Locomotive {
  id?: string;
  reportingMarks: string;
  reportingNumber: string;
  model: string;
  manufacturer: string;
  isDCC: boolean;
  dccAddress?: number;
  dccAddressFormatted?: string;
  homeYard: string;
  isInService: boolean;
  notes?: string;
  homeYardDetails?: {
    _id: string;
    name: string;
  };
  displayName?: string;
  status?: string;
  dccStatus?: string;
}

export interface LocomotiveStatistics {
  total: number;
  inService: number;
  outOfService: number;
  dccEnabled: number;
  dcOnly: number;
  byManufacturer: Record<string, number>;
  availabilityRate: string;
  dccRate: string;
}
```

### Step 2: Add API Service Methods

**File:** `frontend/src/services/api.ts`

```typescript
export const locomotiveApi = {
  getAll: async (params?: any): Promise<Locomotive[]> => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/locomotives?${queryParams}`);
    const data = await response.json();
    return data.data;
  },

  getStatistics: async (): Promise<LocomotiveStatistics> => {
    const response = await fetch(`${API_BASE_URL}/locomotives/statistics`);
    const data = await response.json();
    return data.data;
  },

  create: async (locomotive: Omit<Locomotive, 'id'>): Promise<Locomotive> => {
    const response = await fetch(`${API_BASE_URL}/locomotives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locomotive)
    });
    if (!response.ok) throw new Error('Failed to create');
    const data = await response.json();
    return data.data;
  },

  update: async (id: string, updates: Partial<Locomotive>): Promise<Locomotive> => {
    const response = await fetch(`${API_BASE_URL}/locomotives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update');
    const data = await response.json();
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/locomotives/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete');
  }
};
```

### Step 3: Update AppContext

Add locomotive methods to context state and provide them to consumers.

### Step 4: Create Main Page Component

Follow the pattern from CarManagement.tsx with DataGrid, dialogs, and filtering.

### Step 5: Add Navigation Menu Item

Update Layout.tsx to add "Locomotives" under the Setup section.

---

## Testing Guide

### Unit Tests
Create `frontend/src/pages/__tests__/LocomotiveManagement.test.tsx`

Test:
- Component renders
- Load locomotives on mount
- Add dialog opens/closes
- Form validation
- CRUD operations
- Error handling

### Integration Tests
- Create locomotive via UI
- Edit locomotive
- Delete locomotive
- Filter and search
- Check train assignments

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Locomotive Management                          [+ Add]       │
├─────────────────────────────────────────────────────────────┤
│ Statistics:                                                  │
│ [Total: 10] [In Service: 9] [DCC: 8] [Availability: 90%]   │
├─────────────────────────────────────────────────────────────┤
│ Filters: [Search] [Manufacturer▾] [Service▾] [DCC▾]        │
├─────────────────────────────────────────────────────────────┤
│ Marks │ Number │ Model   │ Mfr   │ DCC    │ Yard  │ Actions│
│ ELMR  │ 003801 │ GP38-2  │ Atlas │ DCC(3801)│ HB   │ ⚙️ 👁 🗑 │
│ ELMR  │ 000901 │ GP9     │ Bach  │ DC      │ HB   │ ⚙️ 👁 🗑 │
└─────────────────────────────────────────────────────────────┘
```

---

## Reference Files

- **Backend Model**: `backend/src/models/locomotive.js`
- **Backend Routes**: `backend/src/routes/locomotives.js`
- **Backend Repository**: `backend/src/repositories/LocomotiveRepository.js`
- **Backend Tests**: `backend/src/tests/routes/locomotives.routes.test.js`
- **Implementation Plan**: `docs/LOCOMOTIVE_IMPLEMENTATION_PLAN.md`

---

## Next Steps

1. Create TypeScript interfaces
2. Add API service methods
3. Update AppContext
4. Create LocomotiveManagement.tsx page
5. Add navigation menu item
6. Create unit tests
7. Test all CRUD operations
8. Add to Dashboard statistics

**Estimated Effort**: 4-6 hours for full implementation with tests
