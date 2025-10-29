import React, { useEffect, useState, useMemo } from 'react';
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
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Edit,
  Search,
  LocationOn,
  Factory,
  FilterList,
  DirectionsCar,
  ExpandMore,
  LocalShipping,
  CheckCircle,
  Warning,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRowsProp } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { Industry, RollingStock, Track } from '../types';
import { CarDemandConfigEditor } from '../components/CarDemandConfigEditor';

interface IndustryFilters {
  search: string;
  station: string;
  isYard: string; // 'all' | 'true' | 'false'
  onLayout: string; // 'all' | 'true' | 'false'
}

const IndustryView: React.FC = () => {
  const {
    industries,
    stations,
    goods,
    cars,
    tracks,
    aarTypes,
    loading,
    error,
    fetchData,
    createIndustry,
    updateIndustry,
    deleteIndustry,
  } = useApp();

  const [filters, setFilters] = useState<IndustryFilters>({
    search: '',
    station: 'all',
    isYard: 'all',
    onLayout: 'all',
  });

  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<Industry>>({
    name: '',
    stationId: '',
    isYard: false,
    isOnLayout: true,
    carDemandConfig: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [industryToDelete, setIndustryToDelete] = useState<Industry | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get cars at each industry
  const getCarsAtIndustry = (industryId: string): RollingStock[] => {
    return cars.filter(car => (car.currentIndustry === industryId));
  };

  // Get tracks for an industry
  const getTracksForIndustry = (industryId: string): Track[] => {
    return tracks.filter(track => track.industryId === industryId);
  };

  // Filter industries based on current filters
  const filteredIndustries = useMemo(() => {
    return industries.filter((industry) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = industry.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Station filter
      if (filters.station !== 'all' && industry.stationId !== filters.station) {
        return false;
      }

      // Yard filter
      if (filters.isYard !== 'all') {
        const isYard = filters.isYard === 'true';
        if (industry.isYard !== isYard) return false;
      }

      // On-layout filter
      if (filters.onLayout !== 'all') {
        const onLayout = filters.onLayout === 'true';
        if (industry.isOnLayout !== onLayout) return false;
      }

      return true;
    });
  }, [industries, filters]);

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Industry Name',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Factory fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'stationId',
      headerName: 'Station',
      width: 150,
      renderCell: (params) => {
        const station = stations.find(s => (s.id || s._id) === params.value);
        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">
              {station ? station.name : 'Unknown'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'isYard',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yard' : 'Industry'}
          color={params.value ? 'primary' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'isOnLayout',
      headerName: 'Location',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'On Layout' : 'Off Layout'}
          color={params.value ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'currentCars',
      headerName: 'Current Cars',
      width: 130,
      sortable: true,
      valueGetter: (_value, row) => {
        return getCarsAtIndustry(row.id || row._id).length;
      },
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <DirectionsCar fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'goodsReceived',
      headerName: 'Goods Received',
      width: 140,
      renderCell: (params) => {
        const goodsCount = params.value?.length || 0;
        return (
          <Chip
            icon={<LocalShipping />}
            label={`${goodsCount} types`}
            size="small"
            color={goodsCount > 0 ? 'info' : 'default'}
          />
        );
      },
    },
    {
      field: 'goodsToShip',
      headerName: 'Goods to Ship',
      width: 140,
      renderCell: (params) => {
        const goodsCount = params.value?.length || 0;
        return (
          <Chip
            icon={<LocalShipping />}
            label={`${goodsCount} types`}
            size="small"
            color={goodsCount > 0 ? 'success' : 'default'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            onClick={() => handleViewIndustry(params.row as Industry)}
            title="View Details"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditIndustry(params.row as Industry)}
            title="Edit Industry"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row as Industry)}
            title="Delete Industry"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows: GridRowsProp = filteredIndustries.map((industry) => ({
    ...industry,
    id: industry.id || industry._id,
  }));

  const handleViewIndustry = (industry: Industry) => {
    setSelectedIndustry(industry);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedIndustry(null);
  };

  const handleAddIndustry = () => {
    setFormMode('add');
    setFormData({
      name: '',
      stationId: '',
      goodsReceived: [],
      goodsToShip: [],
      preferredCarTypes: [],
      isYard: false,
      isOnLayout: true,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleEditIndustry = (industry: Industry) => {
    setFormMode('edit');
    setFormData({
      ...industry,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setFormData({
      name: '',
      stationId: '',
      goodsReceived: [],
      goodsToShip: [],
      preferredCarTypes: [],
      isYard: false,
      isOnLayout: true,
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Industry name is required';
    }

    if (!formData.stationId) {
      errors.stationId = 'Station is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveIndustry = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (formMode === 'add') {
        await createIndustry(formData);
      } else if (formMode === 'edit' && (formData.id || formData._id)) {
        await updateIndustry(formData.id || formData._id || '', formData);
      }
      handleCloseFormDialog();
    } catch (error) {
      console.error('Failed to save industry:', error);
    }
  };

  const handleDeleteClick = (industry: Industry) => {
    setIndustryToDelete(industry);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!industryToDelete) return;

    try {
      await deleteIndustry(industryToDelete.id || industryToDelete._id || '');
      setDeleteConfirmOpen(false);
      setIndustryToDelete(null);
    } catch (error) {
      console.error('Failed to delete industry:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setIndustryToDelete(null);
  };

  // Get goods names for display
  const getGoodsNames = (goodsIds: string[]): string[] => {
    return goodsIds.map(id => {
      const good = goods.find(g => (g.id || g._id) === id);
      return good ? good.name : id;
    });
  };

  // Get car type names
  const getCarTypeNames = (carTypeIds: string[]): string[] => {
    return carTypeIds.map(id => {
      const type = aarTypes.find(t => (t.id || t._id) === id);
      return type ? type.name : id;
    });
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

  const industryStats = {
    total: filteredIndustries.length,
    yards: filteredIndustries.filter(i => i.isYard).length,
    onLayout: filteredIndustries.filter(i => i.isOnLayout).length,
    withCars: filteredIndustries.filter(i => getCarsAtIndustry(i.id || i._id || '').length > 0).length,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Industry View
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddIndustry}
        >
          Add Industry
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
              placeholder="Industry name"
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
              <InputLabel>Station</InputLabel>
              <Select
                value={filters.station}
                label="Station"
                onChange={(e) => setFilters({ ...filters, station: e.target.value })}
              >
                <MenuItem value="all">All Stations</MenuItem>
                {stations.map((station) => (
                  <MenuItem key={station.id || station._id} value={station.id || station._id}>
                    {station.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.isYard}
                label="Type"
                onChange={(e) => setFilters({ ...filters, isYard: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="true">Yards Only</MenuItem>
                <MenuItem value="false">Industries Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.onLayout}
                label="Location"
                onChange={(e) => setFilters({ ...filters, onLayout: e.target.value })}
              >
                <MenuItem value="all">All Locations</MenuItem>
                <MenuItem value="true">On Layout</MenuItem>
                <MenuItem value="false">Off Layout (Staging)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip
          icon={<Factory />}
          label={`Total: ${industryStats.total}`}
          color="primary"
        />
        <Chip
          label={`Yards: ${industryStats.yards}`}
          color="info"
        />
        <Chip
          label={`On Layout: ${industryStats.onLayout}`}
          color="success"
        />
        <Chip
          icon={<DirectionsCar />}
          label={`With Cars: ${industryStats.withCars}`}
          color="secondary"
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

      {/* Industry Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Factory color="primary" />
            {selectedIndustry?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIndustry && (
            <Stack spacing={3} sx={{ pt: 2 }}>
              {/* Basic Info */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip
                    label={selectedIndustry.isYard ? 'Yard' : 'Industry'}
                    color={selectedIndustry.isYard ? 'primary' : 'default'}
                  />
                  <Chip
                    label={selectedIndustry.isOnLayout ? 'On Layout' : 'Off Layout'}
                    color={selectedIndustry.isOnLayout ? 'success' : 'warning'}
                  />
                  <Chip
                    icon={<LocationOn />}
                    label={stations.find(s => (s.id || s._id) === selectedIndustry.stationId)?.name || 'Unknown'}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Current Cars */}
              <Box>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <DirectionsCar />
                  Current Cars ({getCarsAtIndustry(selectedIndustry.id || selectedIndustry._id || '').length})
                </Typography>
                <List dense>
                  {getCarsAtIndustry(selectedIndustry.id || selectedIndustry._id || '').length > 0 ? (
                    getCarsAtIndustry(selectedIndustry.id || selectedIndustry._id || '').map((car) => (
                      <ListItem key={car.id || car._id}>
                        <ListItemText
                          primary={`${car.reportingMarks} ${car.reportingNumber}`}
                          secondary={`${aarTypes.find(t => (t.id || t._id) === car.carType)?.name || car.carType} - ${car.color}`}
                        />
                        <Chip
                          label={car.isInService ? 'In Service' : 'Out of Service'}
                          size="small"
                          color={car.isInService ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No cars currently at this location
                    </Typography>
                  )}
                </List>
              </Box>

              <Divider />

              {/* Goods Received */}
              <Box>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <LocalShipping />
                  Goods Received ({selectedIndustry.goodsReceived.length})
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedIndustry.goodsReceived.length > 0 ? (
                    getGoodsNames(selectedIndustry.goodsReceived).map((goodName, idx) => (
                      <Chip key={idx} label={goodName} size="small" color="info" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No goods received
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Goods to Ship */}
              <Box>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <LocalShipping />
                  Goods to Ship ({selectedIndustry.goodsToShip.length})
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedIndustry.goodsToShip.length > 0 ? (
                    getGoodsNames(selectedIndustry.goodsToShip).map((goodName, idx) => (
                      <Chip key={idx} label={goodName} size="small" color="success" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No goods to ship
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Preferred Car Types */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Preferred Car Types ({selectedIndustry.preferredCarTypes.length})
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedIndustry.preferredCarTypes.length > 0 ? (
                    getCarTypeNames(selectedIndustry.preferredCarTypes).map((typeName, idx) => (
                      <Chip key={idx} label={typeName} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No preferred car types
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Tracks */}
              <Box>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      Tracks ({getTracksForIndustry(selectedIndustry.id || selectedIndustry._id || '').length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {getTracksForIndustry(selectedIndustry.id || selectedIndustry._id || '').length > 0 ? (
                      <List>
                        {getTracksForIndustry(selectedIndustry.id || selectedIndustry._id || '').map((track) => (
                          <ListItem key={track.id || track._id}>
                            <ListItemText
                              primary={`Track ${track.id || track._id}`}
                              secondary={`Capacity: ${track.capacity} | Current: ${track.currentCars.length} cars`}
                            />
                            <Chip
                              icon={track.currentCars.length >= track.capacity ? <Warning /> : <CheckCircle />}
                              label={`${Math.round((track.currentCars.length / track.capacity) * 100)}% Full`}
                              size="small"
                              color={track.currentCars.length >= track.capacity ? 'error' : 'success'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tracks defined for this industry
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Industry Form Dialog (Add/Edit) */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formMode === 'add' ? 'Add New Industry' : 'Edit Industry'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Industry Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />

            <FormControl fullWidth required error={!!formErrors.stationId}>
              <InputLabel>Station</InputLabel>
              <Select
                value={formData.stationId || ''}
                label="Station"
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
              >
                {stations.map((station) => (
                  <MenuItem key={station.id || station._id} value={station.id || station._id}>
                    {station.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.stationId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {formErrors.stationId}
                </Typography>
              )}
            </FormControl>

            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Industry Type:</Typography>
                  <Chip
                    label="Yard"
                    color={formData.isYard ? 'primary' : 'default'}
                    onClick={() => setFormData({ ...formData, isYard: true })}
                    variant={formData.isYard ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Industry"
                    color={!formData.isYard ? 'primary' : 'default'}
                    onClick={() => setFormData({ ...formData, isYard: false })}
                    variant={!formData.isYard ? 'filled' : 'outlined'}
                  />
                </Stack>
              </FormControl>

              <FormControl fullWidth>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Location:</Typography>
                  <Chip
                    label="On Layout"
                    color={formData.isOnLayout ? 'success' : 'default'}
                    onClick={() => setFormData({ ...formData, isOnLayout: true })}
                    variant={formData.isOnLayout ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Off Layout"
                    color={!formData.isOnLayout ? 'warning' : 'default'}
                    onClick={() => setFormData({ ...formData, isOnLayout: false })}
                    variant={!formData.isOnLayout ? 'filled' : 'outlined'}
                  />
                </Stack>
              </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <CarDemandConfigEditor
              value={formData.carDemandConfig || []}
              onChange={(config) => setFormData({ ...formData, carDemandConfig: config })}
              goods={goods.map(g => ({ _id: g.id || g._id || '', name: g.name, category: g.category }))}
              aarTypes={aarTypes.map(t => ({ _id: t.id || t._id || '', code: t.code || t.initial || '', name: t.name }))}
              disabled={loading}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveIndustry}>
            {formMode === 'add' ? 'Create' : 'Save'}
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
            Are you sure you want to delete <strong>{industryToDelete?.name}</strong>?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All data associated with this industry will be permanently removed.
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

export default IndustryView;
