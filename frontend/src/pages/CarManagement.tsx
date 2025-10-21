import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LocationOn,
  DirectionsCar,
  FilterList,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRowsProp } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { RollingStock } from '../types';

interface CarFilters {
  search: string;
  carType: string;
  location: string;
  inService: string; // 'all' | 'true' | 'false'
}

interface CarFormData {
  reportingMarks: string;
  reportingNumber: string;
  carType: string;
  color: string;
  notes: string;
  homeYard: string;
  currentIndustry: string;
  isInService: boolean;
}

const CarManagement: React.FC = () => {
  const {
    cars,
    industries,
    aarTypes,
    loading,
    error,
    fetchData,
    createCar,
    updateCar,
    deleteCar,
  } = useApp();

  const [filters, setFilters] = useState<CarFilters>({
    search: '',
    carType: 'all',
    location: 'all',
    inService: 'all',
  });

  const [selectedCar, setSelectedCar] = useState<RollingStock | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [formData, setFormData] = useState<CarFormData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<RollingStock | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter cars based on current filters
  const filteredCars = cars.filter((car) => {
    // Search filter (reporting marks or number)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        car.reportingMarks.toLowerCase().includes(searchLower) ||
        car.reportingNumber.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Car type filter
    if (filters.carType !== 'all' && car.carType !== filters.carType) {
      return false;
    }

    // Location filter
    if (filters.location !== 'all' && car.currentIndustry !== filters.location) {
      return false;
    }

    // Service status filter
    if (filters.inService !== 'all') {
      const isInService = filters.inService === 'true';
      if (car.isInService !== isInService) return false;
    }

    return true;
  });

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'reportingMarks',
      headerName: 'Reporting Marks',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'reportingNumber',
      headerName: 'Number',
      width: 120,
    },
    {
      field: 'carType',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => {
        const aarType = aarTypes.find(t => (t.id || t._id) === params.value);
        return aarType ? aarType.name : params.value;
      },
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 110,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: params.value,
              border: '1px solid #ccc',
            }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'currentIndustry',
      headerName: 'Location',
      width: 180,
      renderCell: (params) => {
        const industry = industries.find(i => (i.id || i._id) === params.value);
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">
              {industry ? industry.name : 'Unknown'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'isInService',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'In Service' : 'Out of Service'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleViewCar(params.row as RollingStock)}
            title="View/Edit Car"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row as RollingStock)}
            title="Delete Car"
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows: GridRowsProp = filteredCars.map((car) => ({
    ...car,
    id: car.id || car._id, // DataGrid requires 'id' field, backend uses '_id'
  }));

  const handleViewCar = (car: RollingStock) => {
    setSelectedCar(car);
    setFormData({
      reportingMarks: car.reportingMarks,
      reportingNumber: car.reportingNumber,
      carType: car.carType,
      color: car.color,
      notes: car.notes || '',
      homeYard: car.homeYard,
      currentIndustry: car.currentIndustry,
      isInService: car.isInService,
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setFormData({
      reportingMarks: '',
      reportingNumber: '',
      carType: (aarTypes[0]?.id || aarTypes[0]?._id) || '',
      color: 'brown',
      notes: '',
      homeYard: (industries[0]?.id || industries[0]?._id) || '',
      currentIndustry: (industries[0]?.id || industries[0]?._id) || '',
      isInService: true,
    });
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleDeleteClick = (car: RollingStock) => {
    setCarToDelete(car);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!carToDelete) return;

    try {
      await deleteCar(carToDelete.id || carToDelete._id || '');
      setDeleteConfirmOpen(false);
      setCarToDelete(null);
    } catch (error) {
      console.error('Failed to delete car:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete car');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setCarToDelete(null);
  };

  const handleSaveCar = async () => {
    if (!formData) return;

    try {
      if (dialogMode === 'edit' && selectedCar) {
        // Update existing car
        const carId = selectedCar.id || selectedCar._id;
        if (!carId) {
          alert('Cannot update car: missing ID');
          return;
        }
        await updateCar(carId, formData);
        alert('Car updated successfully!');
      } else if (dialogMode === 'add') {
        // Create new car
        await createCar(formData);
        alert('Car created successfully!');
      }
      setDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save car');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCar(null);
    setFormData(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Car Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCar}
        >
          Add Car
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList color="primary" />
            <Typography variant="h6">Filters</Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Reporting marks or number"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Car Type</InputLabel>
              <Select
                value={filters.carType}
                label="Car Type"
                onChange={(e) => setFilters({ ...filters, carType: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                {aarTypes.map((type) => (
                  <MenuItem key={type.id || type._id} value={type.id || type._id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.location}
                label="Location"
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {industries.map((industry) => (
                  <MenuItem key={industry.id || industry._id} value={industry.id || industry._id}>
                    {industry.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Service Status</InputLabel>
              <Select
                value={filters.inService}
                label="Service Status"
                onChange={(e) => setFilters({ ...filters, inService: e.target.value })}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="true">In Service</MenuItem>
                <MenuItem value="false">Out of Service</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Box display="flex" gap={2} mb={3}>
        <Chip
          icon={<DirectionsCar />}
          label={`Total: ${filteredCars.length} cars`}
          color="primary"
        />
        <Chip
          label={`In Service: ${filteredCars.filter(c => c.isInService).length}`}
          color="success"
        />
        <Chip
          label={`Out of Service: ${filteredCars.filter(c => !c.isInService).length}`}
          color="default"
        />
      </Box>

      {/* DataGrid */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      </Card>

      {/* Car Detail/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Car' : 'Edit Car'}
        </DialogTitle>
        <DialogContent>
          {formData && (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Reporting Marks"
                  value={formData.reportingMarks}
                  onChange={(e) => setFormData({ ...formData, reportingMarks: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Reporting Number"
                  value={formData.reportingNumber}
                  onChange={(e) => setFormData({ ...formData, reportingNumber: e.target.value })}
                  required
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Car Type</InputLabel>
                  <Select
                    value={formData.carType}
                    label="Car Type"
                    onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
                  >
                    {aarTypes.map((type) => (
                      <MenuItem key={type.id || type._id} value={type.id || type._id}>
                        {type.name} ({type.initial})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  required
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Home Yard</InputLabel>
                  <Select
                    value={formData.homeYard}
                    label="Home Yard"
                    onChange={(e) => setFormData({ ...formData, homeYard: e.target.value })}
                  >
                    {industries.filter(i => i.isYard).map((yard) => (
                      <MenuItem key={yard.id || yard._id} value={yard.id || yard._id}>
                        {yard.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Current Location</InputLabel>
                  <Select
                    value={formData.currentIndustry}
                    label="Current Location"
                    onChange={(e) => setFormData({ ...formData, currentIndustry: e.target.value })}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry.id || industry._id} value={industry.id || industry._id}>
                        {industry.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isInService}
                    onChange={(e) => setFormData({ ...formData, isInService: e.target.checked })}
                  />
                }
                label="In Service"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCar}
            variant="contained"
            disabled={!formData?.reportingMarks || !formData?.reportingNumber}
          >
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{carToDelete?.reportingMarks} {carToDelete?.reportingNumber}</strong>?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All data associated with this car will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarManagement;
