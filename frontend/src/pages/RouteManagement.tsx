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
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Route as RouteIcon,
  FilterList,
  Visibility,
  TripOrigin,
  Flag,
  ArrowUpward,
  ArrowDownward,
  Close,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRowsProp } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { Route } from '../types';

interface RouteFilters {
  search: string;
  originYard: string;
  terminationYard: string;
  stationCount: string; // 'all' | 'direct' | '1-3' | '4+'
}

interface RouteFormData {
  name: string;
  description: string;
  originYard: string;
  terminationYard: string;
  stationSequence: string[];
}

const RouteManagement: React.FC = () => {
  const {
    routes,
    industries,
    stations,
    loading,
    error,
    fetchData,
    createRoute,
    updateRoute,
  } = useApp();

  const [filters, setFilters] = useState<RouteFilters>({
    search: '',
    originYard: 'all',
    terminationYard: 'all',
    stationCount: 'all',
  });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    description: '',
    originYard: '',
    terminationYard: '',
    stationSequence: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableStation, setAvailableStation] = useState<string>('');

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewRoute, setViewRoute] = useState<Route | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get yard industries (only yards)
  const yards = useMemo(() => {
    return industries.filter(i => i.isYard);
  }, [industries]);

  // Filter routes based on current filters
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      // Search filter (name or description)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          route.name.toLowerCase().includes(searchLower) ||
          (route.description && route.description.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Origin yard filter
      if (filters.originYard !== 'all' && route.originYard !== filters.originYard) {
        return false;
      }

      // Termination yard filter
      if (filters.terminationYard !== 'all' && route.terminationYard !== filters.terminationYard) {
        return false;
      }

      // Station count filter
      if (filters.stationCount !== 'all') {
        const stationCount = route.stationSequence.length;
        switch (filters.stationCount) {
          case 'direct':
            if (stationCount !== 0) return false;
            break;
          case '1-3':
            if (stationCount < 1 || stationCount > 3) return false;
            break;
          case '4+':
            if (stationCount < 4) return false;
            break;
        }
      }

      return true;
    });
  }, [routes, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredRoutes.length;
    const totalStations = filteredRoutes.reduce((sum, r) => sum + r.stationSequence.length, 0);
    const avgStations = total > 0 ? (totalStations / total).toFixed(1) : '0';
    const directRoutes = filteredRoutes.filter(r => r.stationSequence.length === 0).length;

    return { total, avgStations, directRoutes };
  }, [filteredRoutes]);

  // Get industry name by ID
  const getIndustryName = (industryId: string): string => {
    const industry = industries.find(i => (i.id || i._id) === industryId);
    return industry ? industry.name : 'Unknown';
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Route Name',
      width: 220,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <RouteIcon fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'originYard',
      headerName: 'Origin Yard',
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <TripOrigin fontSize="small" color="action" />
          <Typography variant="body2">
            {getIndustryName(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'terminationYard',
      headerName: 'Destination Yard',
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Flag fontSize="small" color="action" />
          <Typography variant="body2">
            {getIndustryName(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'stationSequence',
      headerName: '# of Stations',
      width: 140,
      sortable: true,
      valueGetter: (_value, row) => {
        return row.stationSequence.length;
      },
      renderCell: (params) => {
        const count = params.value;
        return (
          <Chip
            label={count === 0 ? 'Direct' : `${count} stop${count !== 1 ? 's' : ''}`}
            size="small"
            color={count === 0 ? 'primary' : 'default'}
            variant={count === 0 ? 'filled' : 'outlined'}
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
            onClick={() => handleViewRoute(params.row as Route)}
            title="View Details"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditRoute(params.row as Route)}
            title="Edit Route"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row as Route)}
            title="Delete Route"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows: GridRowsProp = filteredRoutes.map((route) => ({
    ...route,
    id: route.id || route._id,
  }));

  // Get station name by ID
  const getStationName = (stationId: string): string => {
    const station = stations.find(s => (s.id || s._id) === stationId);
    return station ? station.name : 'Unknown';
  };

  const handleViewRoute = (route: Route) => {
    setViewRoute(route);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setViewRoute(null);
  };

  const handleEditRoute = (route: Route) => {
    setFormMode('edit');
    setSelectedRoute(route);
    setFormData({
      name: route.name,
      description: route.description || '',
      originYard: route.originYard,
      terminationYard: route.terminationYard,
      stationSequence: [...route.stationSequence],
    });
    setFormErrors({});
    setAvailableStation('');
    setFormDialogOpen(true);
  };

  const handleAddRoute = () => {
    setFormMode('add');
    setSelectedRoute(null);
    setFormData({
      name: '',
      description: '',
      originYard: yards[0]?.id || yards[0]?._id || '',
      terminationYard: yards[0]?.id || yards[0]?._id || '',
      stationSequence: [],
    });
    setFormErrors({});
    setAvailableStation('');
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      originYard: '',
      terminationYard: '',
      stationSequence: [],
    });
    setFormErrors({});
    setAvailableStation('');
    setSelectedRoute(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Route name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Route name must be 100 characters or less';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    if (!formData.originYard) {
      errors.originYard = 'Origin yard is required';
    }

    if (!formData.terminationYard) {
      errors.terminationYard = 'Termination yard is required';
    }

    if (formData.originYard === formData.terminationYard) {
      errors.terminationYard = 'Termination yard must be different from origin yard';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRoute = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (formMode === 'add') {
        await createRoute(formData);
      } else if (formMode === 'edit' && selectedRoute) {
        const routeId = selectedRoute.id || selectedRoute._id;
        if (!routeId) {
          alert('Cannot update route: missing ID');
          return;
        }
        await updateRoute(routeId, formData);
      }
      handleCloseFormDialog();
    } catch (error) {
      console.error('Failed to save route:', error);
      alert(error instanceof Error ? error.message : 'Failed to save route');
    }
  };

  const handleAddStation = () => {
    if (!availableStation) return;

    // Check if station is already in sequence
    if (formData.stationSequence.includes(availableStation)) {
      alert('This station is already in the route sequence');
      return;
    }

    setFormData({
      ...formData,
      stationSequence: [...formData.stationSequence, availableStation],
    });
    setAvailableStation('');
  };

  const handleRemoveStation = (index: number) => {
    setFormData({
      ...formData,
      stationSequence: formData.stationSequence.filter((_, i) => i !== index),
    });
  };

  const handleMoveStationUp = (index: number) => {
    if (index === 0) return;

    const newSequence = [...formData.stationSequence];
    [newSequence[index - 1], newSequence[index]] = [newSequence[index], newSequence[index - 1]];
    setFormData({ ...formData, stationSequence: newSequence });
  };

  const handleMoveStationDown = (index: number) => {
    if (index === formData.stationSequence.length - 1) return;

    const newSequence = [...formData.stationSequence];
    [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
    setFormData({ ...formData, stationSequence: newSequence });
  };

  const handleDeleteClick = (route: Route) => {
    // TODO: Step 11 - Implement delete confirmation
    console.log('Delete route:', route);
    alert('Delete confirmation dialog coming in Step 11!');
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
          Route Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRoute}
        >
          Add Route
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
              placeholder="Route name or description"
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
              <InputLabel>Origin Yard</InputLabel>
              <Select
                value={filters.originYard}
                label="Origin Yard"
                onChange={(e) => setFilters({ ...filters, originYard: e.target.value })}
              >
                <MenuItem value="all">All Origins</MenuItem>
                {yards.map((yard) => (
                  <MenuItem key={yard.id || yard._id} value={yard.id || yard._id}>
                    {yard.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Destination Yard</InputLabel>
              <Select
                value={filters.terminationYard}
                label="Destination Yard"
                onChange={(e) => setFilters({ ...filters, terminationYard: e.target.value })}
              >
                <MenuItem value="all">All Destinations</MenuItem>
                {yards.map((yard) => (
                  <MenuItem key={yard.id || yard._id} value={yard.id || yard._id}>
                    {yard.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Station Count</InputLabel>
              <Select
                value={filters.stationCount}
                label="Station Count"
                onChange={(e) => setFilters({ ...filters, stationCount: e.target.value })}
              >
                <MenuItem value="all">All Routes</MenuItem>
                <MenuItem value="direct">Direct (0 stops)</MenuItem>
                <MenuItem value="1-3">1-3 stops</MenuItem>
                <MenuItem value="4+">4+ stops</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip
          icon={<RouteIcon />}
          label={`Total Routes: ${stats.total}`}
          color="primary"
        />
        <Chip
          label={`Avg Stations: ${stats.avgStations}`}
          color="info"
        />
        <Chip
          label={`Direct Routes: ${stats.directRoutes}`}
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

      {/* Add/Edit Route Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formMode === 'add' ? 'Add New Route' : 'Edit Route'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            {/* Route Name */}
            <TextField
              fullWidth
              label="Route Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              inputProps={{ maxLength: 100 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={!!formErrors.description}
              helperText={formErrors.description}
              inputProps={{ maxLength: 500 }}
            />

            {/* Origin and Termination Yards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <FormControl fullWidth required error={!!formErrors.originYard}>
                <InputLabel>Origin Yard</InputLabel>
                <Select
                  value={formData.originYard}
                  label="Origin Yard"
                  onChange={(e) => setFormData({ ...formData, originYard: e.target.value })}
                >
                  {yards.map((yard) => (
                    <MenuItem key={yard.id || yard._id} value={yard.id || yard._id}>
                      {yard.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.originYard && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.originYard}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth required error={!!formErrors.terminationYard}>
                <InputLabel>Termination Yard</InputLabel>
                <Select
                  value={formData.terminationYard}
                  label="Termination Yard"
                  onChange={(e) => setFormData({ ...formData, terminationYard: e.target.value })}
                >
                  {yards.map((yard) => (
                    <MenuItem key={yard.id || yard._id} value={yard.id || yard._id}>
                      {yard.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.terminationYard && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.terminationYard}
                  </Typography>
                )}
              </FormControl>
            </Box>

            <Divider />

            {/* Station Sequence Builder */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Station Sequence
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Add stations in the order the route will visit them. Leave empty for direct yard-to-yard transfers.
              </Typography>

              {/* Add Station Controls */}
              <Box display="flex" gap={1} mt={2} mb={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Available Stations</InputLabel>
                  <Select
                    value={availableStation}
                    label="Available Stations"
                    onChange={(e) => setAvailableStation(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select a station</em>
                    </MenuItem>
                    {stations.map((station) => (
                      <MenuItem key={station.id || station._id} value={station.id || station._id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAddStation}
                  disabled={!availableStation}
                  sx={{ minWidth: '120px' }}
                >
                  Add Station
                </Button>
              </Box>

              {/* Current Station Sequence */}
              {formData.stationSequence.length > 0 ? (
                <Card variant="outlined">
                  <List dense>
                    {formData.stationSequence.map((stationId, index) => (
                      <React.Fragment key={`${stationId}-${index}`}>
                        {index > 0 && <Divider />}
                        <ListItem
                          secondaryAction={
                            <Box display="flex" gap={0.5}>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleMoveStationUp(index)}
                                disabled={index === 0}
                                title="Move Up"
                              >
                                <ArrowUpward fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleMoveStationDown(index)}
                                disabled={index === formData.stationSequence.length - 1}
                                title="Move Down"
                              >
                                <ArrowDownward fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                onClick={() => handleRemoveStation(index)}
                                title="Remove"
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={`#${index + 1}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Typography variant="body2">
                                  {getStationName(stationId)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No stations added yet. This will be a direct yard-to-yard route.
                </Alert>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRoute}
            disabled={!formData.name.trim() || !formData.originYard || !formData.terminationYard}
          >
            {formMode === 'add' ? 'Create Route' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Route Detail View Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RouteIcon color="primary" />
            <Typography variant="h6">Route Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewRoute && (
            <Stack spacing={3} sx={{ pt: 2 }}>
              {/* Route Name */}
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Route Name
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {viewRoute.name}
                </Typography>
              </Box>

              {/* Description */}
              {viewRoute.description && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {viewRoute.description}
                  </Typography>
                </Box>
              )}

              <Divider />

              {/* Origin and Termination Yards */}
              <Box>
                <Typography variant="overline" color="text.secondary" gutterBottom>
                  Route Path
                </Typography>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TripOrigin color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Origin
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {getIndustryName(viewRoute.originYard)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" color="text.secondary">
                    →
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Flag color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {getIndustryName(viewRoute.terminationYard)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Station Sequence */}
              <Box>
                <Typography variant="overline" color="text.secondary" gutterBottom>
                  Station Sequence
                </Typography>
                {viewRoute.stationSequence.length > 0 ? (
                  <Card variant="outlined">
                    <List dense>
                      {viewRoute.stationSequence.map((stationId, index) => (
                        <React.Fragment key={`${stationId}-${index}`}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Chip
                                    label={`Stop #${index + 1}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Typography variant="body1">
                                    {getStationName(stationId)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </Card>
                ) : (
                  <Alert severity="info" icon={<RouteIcon />}>
                    Direct yard-to-yard route with no intermediate stops
                  </Alert>
                )}
              </Box>

              {/* Route Summary */}
              <Box>
                <Typography variant="overline" color="text.secondary" gutterBottom>
                  Route Summary
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={`${viewRoute.stationSequence.length} ${viewRoute.stationSequence.length === 1 ? 'Stop' : 'Stops'}`}
                    color="primary"
                    variant="outlined"
                  />
                  {viewRoute.stationSequence.length === 0 && (
                    <Chip
                      label="Direct Route"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => {
              if (viewRoute) {
                handleCloseDetailDialog();
                handleEditRoute(viewRoute);
              }
            }}
          >
            Edit Route
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteManagement;
