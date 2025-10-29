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
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Train,
  Visibility,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { Locomotive, LocomotiveFormData, LocomotiveTrainAssignment } from '../types';

interface LocomotiveFilters {
  search: string;
  manufacturer: string;
  model: string;
  homeYard: string;
  inService: string; // 'all' | 'true' | 'false'
  isDCC: string; // 'all' | 'true' | 'false'
}

const APPROVED_MANUFACTURERS = [
  'Atlas',
  'Kato',
  'Lionel',
  'Bachmann',
  'Athearn',
  'Walthers',
  'Broadway Limited',
  'MTH',
  'Rapido',
];

const LocomotiveManagement: React.FC = () => {
  const {
    locomotives,
    industries,
    locomotiveStatistics,
    loading,
    error,
    fetchData,
    fetchLocomotives,
    fetchLocomotiveStatistics,
    createLocomotive,
    updateLocomotive,
    deleteLocomotive,
    getLocomotiveAssignments,
  } = useApp();

  const [filters, setFilters] = useState<LocomotiveFilters>({
    search: '',
    manufacturer: 'all',
    model: 'all',
    homeYard: 'all',
    inService: 'all',
    isDCC: 'all',
  });

  const [selectedLocomotive, setSelectedLocomotive] = useState<Locomotive | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [trainAssignments, setTrainAssignments] = useState<LocomotiveTrainAssignment | null>(null);
  const [formData, setFormData] = useState<LocomotiveFormData>({
    reportingMarks: '',
    reportingNumber: '',
    model: '',
    manufacturer: 'Atlas',
    isDCC: true,
    dccAddress: 3,
    homeYard: '',
    isInService: true,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLocomotiveStatistics();
  }, []);

  // Get yards for dropdown
  const yards = industries.filter((ind) => ind.isYard && ind.isOnLayout);

  // Get unique models for filter
  const uniqueModels = Array.from(new Set(locomotives.map((l) => l.model))).sort();

  // Filter locomotives
  const filteredLocomotives = locomotives.filter((loco) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        loco.reportingMarks.toLowerCase().includes(searchLower) ||
        loco.reportingNumber.includes(searchLower) ||
        loco.model.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.manufacturer !== 'all' && loco.manufacturer !== filters.manufacturer) {
      return false;
    }

    if (filters.model !== 'all' && loco.model !== filters.model) {
      return false;
    }

    if (filters.homeYard !== 'all' && loco.homeYard !== filters.homeYard) {
      return false;
    }

    if (filters.inService !== 'all') {
      const isInService = filters.inService === 'true';
      if (loco.isInService !== isInService) return false;
    }

    if (filters.isDCC !== 'all') {
      const isDCC = filters.isDCC === 'true';
      if (loco.isDCC !== isDCC) return false;
    }

    return true;
  });

  const handleOpenDialog = (mode: 'view' | 'edit' | 'add', loco?: Locomotive) => {
    setDialogMode(mode);
    if (loco) {
      setSelectedLocomotive(loco);
      if (mode === 'edit') {
        setFormData({
          reportingMarks: loco.reportingMarks,
          reportingNumber: loco.reportingNumber,
          model: loco.model,
          manufacturer: loco.manufacturer,
          isDCC: loco.isDCC,
          dccAddress: loco.dccAddress,
          homeYard: loco.homeYard,
          isInService: loco.isInService,
          notes: loco.notes || '',
        });
      }
    } else {
      setSelectedLocomotive(null);
      setFormData({
        reportingMarks: '',
        reportingNumber: '',
        model: '',
        manufacturer: 'Atlas',
        isDCC: true,
        dccAddress: 3,
        homeYard: yards[0]?._id || '',
        isInService: true,
        notes: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLocomotive(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.reportingMarks.trim()) {
      errors.reportingMarks = 'Reporting marks required';
    } else if (formData.reportingMarks.length > 10) {
      errors.reportingMarks = 'Maximum 10 characters';
    }

    if (!formData.reportingNumber.trim()) {
      errors.reportingNumber = 'Reporting number required';
    } else if (formData.reportingNumber.length !== 6) {
      errors.reportingNumber = 'Must be exactly 6 characters';
    }

    if (!formData.model.trim()) {
      errors.model = 'Model required';
    } else if (formData.model.length > 50) {
      errors.model = 'Maximum 50 characters';
    }

    if (!formData.homeYard) {
      errors.homeYard = 'Home yard required';
    }

    if (formData.isDCC) {
      if (!formData.dccAddress || formData.dccAddress < 1 || formData.dccAddress > 9999) {
        errors.dccAddress = 'DCC address must be between 1 and 9999';
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Maximum 500 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (dialogMode === 'add') {
        await createLocomotive(formData);
      } else if (dialogMode === 'edit' && selectedLocomotive) {
        await updateLocomotive(selectedLocomotive._id || selectedLocomotive.id!, formData);
      }
      handleCloseDialog();
      await fetchLocomotives();
      await fetchLocomotiveStatistics();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Operation failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocomotive) return;

    setSubmitting(true);
    try {
      await deleteLocomotive(selectedLocomotive._id || selectedLocomotive.id!);
      setDeleteDialogOpen(false);
      setSelectedLocomotive(null);
      await fetchLocomotives();
      await fetchLocomotiveStatistics();
    } catch (err) {
      // Error will be shown in the error state
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckAssignments = async (loco: Locomotive) => {
    setSelectedLocomotive(loco);
    try {
      const assignments = await getLocomotiveAssignments(loco._id || loco.id!);
      setTrainAssignments(assignments);
      setAssignmentsDialogOpen(true);
    } catch (err) {
      // Error will be shown in the error state
    }
  };

  const columns: GridColDef<Locomotive>[] = [
    {
      field: 'reportingMarks',
      headerName: 'Marks',
      width: 100,
      sortable: true,
    },
    {
      field: 'reportingNumber',
      headerName: 'Number',
      width: 100,
      sortable: true,
    },
    {
      field: 'displayName',
      headerName: 'Designation',
      width: 150,
      valueGetter: (_value, row) => `${row.reportingMarks} ${row.reportingNumber}`,
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 130,
      sortable: true,
    },
    {
      field: 'manufacturer',
      headerName: 'Manufacturer',
      width: 140,
      sortable: true,
    },
    {
      field: 'dccStatus',
      headerName: 'DCC',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.isDCC ? `DCC (${params.row.dccAddressFormatted || params.row.dccAddress})` : 'DC'}
          color={params.row.isDCC ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'homeYard',
      headerName: 'Home Yard',
      width: 150,
      valueGetter: (_value, row) => {
        const yard = industries.find((i) => (i._id || i.id) === row.homeYard);
        return yard?.name || row.homeYard;
      },
    },
    {
      field: 'isInService',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.isInService ? 'In Service' : 'Out of Service'}
          color={params.row.isInService ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleOpenDialog('view', params.row)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenDialog('edit', params.row)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedLocomotive(params.row);
                setDeleteDialogOpen(true);
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Check Train Assignments">
            <IconButton size="small" onClick={() => handleCheckAssignments(params.row)}>
              <Train />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Locomotive Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('add')}
          disabled={loading}
        >
          Add Locomotive
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {locomotiveStatistics && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Locomotives
              </Typography>
              <Typography variant="h4">{locomotiveStatistics.total}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Service
              </Typography>
              <Typography variant="h4" color="success.main">
                {locomotiveStatistics.inService}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {locomotiveStatistics.availabilityRate} availability
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                DCC Equipped
              </Typography>
              <Typography variant="h4" color="primary.main">
                {locomotiveStatistics.dccEnabled}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {locomotiveStatistics.dccRate} DCC rate
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Out of Service
              </Typography>
              <Typography variant="h4" color="warning.main">
                {locomotiveStatistics.outOfService}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search by marks, number, or model..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <TextField
              select
              label="Manufacturer"
              value={filters.manufacturer}
              onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Manufacturers</MenuItem>
              {APPROVED_MANUFACTURERS.map((mfr) => (
                <MenuItem key={mfr} value={mfr}>
                  {mfr}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Model"
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Models</MenuItem>
              {uniqueModels.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Home Yard"
              value={filters.homeYard}
              onChange={(e) => setFilters({ ...filters, homeYard: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Yards</MenuItem>
              {yards.map((yard) => (
                <MenuItem key={yard._id || yard.id} value={yard._id || yard.id}>
                  {yard.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Service Status"
              value={filters.inService}
              onChange={(e) => setFilters({ ...filters, inService: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">In Service</MenuItem>
              <MenuItem value="false">Out of Service</MenuItem>
            </TextField>
            <TextField
              select
              label="DCC Status"
              value={filters.isDCC}
              onChange={(e) => setFilters({ ...filters, isDCC: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">DCC</MenuItem>
              <MenuItem value="false">DC</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={filteredLocomotives.map((loco) => ({
                  ...loco,
                  id: loco._id || loco.id,
                }))}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 },
                  },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit/View Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' && 'Add New Locomotive'}
          {dialogMode === 'edit' && 'Edit Locomotive'}
          {dialogMode === 'view' && 'Locomotive Details'}
        </DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.submit}
            </Alert>
          )}

          {dialogMode === 'view' && selectedLocomotive ? (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Typography variant="h6">{selectedLocomotive.displayName || `${selectedLocomotive.reportingMarks} ${selectedLocomotive.reportingNumber}`}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Model</Typography>
                  <Typography variant="body1">{selectedLocomotive.model}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                  <Typography variant="body1">{selectedLocomotive.manufacturer}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">DCC Status</Typography>
                  <Typography variant="body1">
                    {selectedLocomotive.isDCC ? `DCC (Address: ${selectedLocomotive.dccAddress})` : 'DC'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Service Status</Typography>
                  <Chip
                    label={selectedLocomotive.isInService ? 'In Service' : 'Out of Service'}
                    color={selectedLocomotive.isInService ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Home Yard</Typography>
                <Typography variant="body1">
                  {selectedLocomotive.homeYardDetails?.name || industries.find(i => (i._id || i.id) === selectedLocomotive.homeYard)?.name || selectedLocomotive.homeYard}
                </Typography>
              </Box>
              {selectedLocomotive.notes && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Notes</Typography>
                  <Typography variant="body1">{selectedLocomotive.notes}</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Reporting Marks"
                  value={formData.reportingMarks}
                  onChange={(e) => setFormData({ ...formData, reportingMarks: e.target.value.toUpperCase() })}
                  error={!!formErrors.reportingMarks}
                  helperText={formErrors.reportingMarks || 'e.g., ELMR, UP, SP (max 10 chars)'}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                  inputProps={{ maxLength: 10 }}
                />
                <TextField
                  label="Reporting Number"
                  value={formData.reportingNumber}
                  onChange={(e) => setFormData({ ...formData, reportingNumber: e.target.value })}
                  error={!!formErrors.reportingNumber}
                  helperText={formErrors.reportingNumber || 'Exactly 6 digits (e.g., 003801)'}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                  inputProps={{ maxLength: 6 }}
                />
                <TextField
                  label="Model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  error={!!formErrors.model}
                  helperText={formErrors.model || 'e.g., GP38-2, SD40-2'}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                />
                <FormControl fullWidth required disabled={dialogMode === 'view'}>
                  <InputLabel>Manufacturer</InputLabel>
                  <Select
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    label="Manufacturer"
                  >
                    {APPROVED_MANUFACTURERS.map((mfr) => (
                      <MenuItem key={mfr} value={mfr}>
                        {mfr}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <FormControl fullWidth required disabled={dialogMode === 'view'}>
                <InputLabel>Home Yard</InputLabel>
                <Select
                  value={formData.homeYard}
                  onChange={(e) => setFormData({ ...formData, homeYard: e.target.value })}
                  label="Home Yard"
                  error={!!formErrors.homeYard}
                >
                  {yards.map((yard) => (
                    <MenuItem key={yard._id || yard.id} value={yard._id || yard.id}>
                      {yard.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDCC}
                    onChange={(e) => setFormData({ ...formData, isDCC: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="DCC Equipped"
              />
              {formData.isDCC && (
                <TextField
                  label="DCC Address"
                  type="number"
                  value={formData.dccAddress || ''}
                  onChange={(e) => setFormData({ ...formData, dccAddress: parseInt(e.target.value) || undefined })}
                  error={!!formErrors.dccAddress}
                  helperText={formErrors.dccAddress || 'Range: 1-9999'}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                  inputProps={{ min: 1, max: 9999 }}
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isInService}
                    onChange={(e) => setFormData({ ...formData, isInService: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="In Service"
              />
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                error={!!formErrors.notes}
                helperText={formErrors.notes || `${(formData.notes || '').length}/500 characters`}
                fullWidth
                multiline
                rows={3}
                disabled={dialogMode === 'view'}
                inputProps={{ maxLength: 500 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Add' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Locomotive</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete locomotive{' '}
            <strong>
              {selectedLocomotive?.reportingMarks} {selectedLocomotive?.reportingNumber}
            </strong>
            ?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The locomotive will be permanently removed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Train Assignments Dialog */}
      <Dialog open={assignmentsDialogOpen} onClose={() => setAssignmentsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Train Assignments</DialogTitle>
        <DialogContent>
          {trainAssignments ? (
            <Box sx={{ pt: 2 }}>
              {trainAssignments.isAssigned ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This locomotive is assigned to {trainAssignments.trainCount} train(s)
                  </Alert>
                  <Stack spacing={1}>
                    {trainAssignments.trains.map((train) => (
                      <Card key={train._id} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1">{train.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Status: <Chip label={train.status} size="small" />
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Session: {train.sessionNumber}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </>
              ) : (
                <Alert severity="success">
                  This locomotive is not currently assigned to any trains.
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocomotiveManagement;
