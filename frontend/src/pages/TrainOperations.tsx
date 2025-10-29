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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  CheckCircle,
  Cancel,
  ViewList,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { Train, TrainFormData, TrainStatus } from '../types';

interface TrainFilters {
  sessionNumber: number | 'all';
  status: TrainStatus | 'all';
  routeId: string | 'all';
}

const TrainOperations: React.FC = () => {
  const {
    trains,
    routes,
    locomotives,
    currentSession,
    trainsLoading,
    error,
    fetchCurrentSession,
    fetchTrains,
    createTrain,
    updateTrain,
    deleteTrain,
    generateSwitchList,
    completeTrain,
    cancelTrain,
  } = useApp();

  const [filters, setFilters] = useState<TrainFilters>({
    sessionNumber: 'all',
    status: 'all',
    routeId: 'all',
  });

  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<TrainFormData>({
    name: '',
    routeId: '',
    locomotiveIds: [],
    maxCapacity: 20,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainToDelete, setTrainToDelete] = useState<Train | null>(null);
  const [switchListDialogOpen, setSwitchListDialogOpen] = useState(false);
  const [trainForSwitchList, setTrainForSwitchList] = useState<Train | null>(null);
  const [actionConfirmOpen, setActionConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'generate' | 'complete' | 'cancel' | null>(null);
  const [trainForAction, setTrainForAction] = useState<Train | null>(null);

  useEffect(() => {
    fetchCurrentSession();
    fetchTrains();
  }, [fetchCurrentSession, fetchTrains]);

  // Filter trains
  const filteredTrains = trains.filter((train) => {
    if (filters.sessionNumber !== 'all' && train.sessionNumber !== filters.sessionNumber) {
      return false;
    }
    if (filters.status !== 'all' && train.status !== filters.status) {
      return false;
    }
    if (filters.routeId !== 'all' && train.routeId !== filters.routeId) {
      return false;
    }
    return true;
  });

  // Get status color
  const getStatusColor = (status: TrainStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'Planned':
        return 'default';
      case 'In Progress':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle dialog open
  const handleOpenDialog = (mode: 'add' | 'edit', train?: Train) => {
    setDialogMode(mode);
    if (mode === 'edit' && train) {
      setSelectedTrain(train);
      setFormData({
        name: train.name,
        routeId: train.routeId,
        locomotiveIds: train.locomotiveIds,
        maxCapacity: train.maxCapacity,
      });
    } else {
      setSelectedTrain(null);
      setFormData({
        name: '',
        routeId: '',
        locomotiveIds: [],
        maxCapacity: 20,
      });
    }
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTrain(null);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        await createTrain(formData);
      } else if (dialogMode === 'edit' && selectedTrain) {
        await updateTrain(selectedTrain._id || selectedTrain.id!, formData);
      }
      handleCloseDialog();
      await fetchTrains();
    } catch (err) {
      // Error handled by AppContext
    }
  };

  // Handle delete
  const handleDeleteClick = (train: Train) => {
    setTrainToDelete(train);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (trainToDelete) {
      try {
        await deleteTrain(trainToDelete._id || trainToDelete.id!);
        setDeleteConfirmOpen(false);
        setTrainToDelete(null);
        await fetchTrains();
      } catch (err) {
        // Error handled by AppContext
      }
    }
  };

  // Handle action confirm
  const handleActionClick = (type: 'generate' | 'complete' | 'cancel', train: Train) => {
    setActionType(type);
    setTrainForAction(train);
    setActionConfirmOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!trainForAction || !actionType) return;

    try {
      if (actionType === 'generate') {
        const updatedTrain = await generateSwitchList(trainForAction._id || trainForAction.id!);
        setTrainForSwitchList(updatedTrain);
        setSwitchListDialogOpen(true);
      } else if (actionType === 'complete') {
        await completeTrain(trainForAction._id || trainForAction.id!);
      } else if (actionType === 'cancel') {
        await cancelTrain(trainForAction._id || trainForAction.id!);
      }
      setActionConfirmOpen(false);
      setActionType(null);
      setTrainForAction(null);
      await fetchTrains();
    } catch (err) {
      // Error handled by AppContext
    }
  };

  // Handle view switch list
  const handleViewSwitchList = (train: Train) => {
    setTrainForSwitchList(train);
    setSwitchListDialogOpen(true);
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Train Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'routeName',
      headerName: 'Route',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => {
        const route = routes.find(r => (r._id || r.id) === row.routeId);
        return route?.name || 'Unknown';
      },
    },
    {
      field: 'sessionNumber',
      headerName: 'Session',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value as TrainStatus)}
          size="small"
        />
      ),
    },
    {
      field: 'locomotiveCount',
      headerName: 'Locos',
      width: 80,
      valueGetter: (_value, row) => row.locomotiveIds?.length || 0,
    },
    {
      field: 'capacity',
      headerName: 'Capacity',
      width: 100,
      valueGetter: (_value, row) => {
        const assigned = row.assignedCarIds?.length || 0;
        return `${assigned}/${row.maxCapacity}`;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params) => {
        const train = params.row as Train;
        const canEdit = train.status === 'Planned';
        const canGenerate = train.status === 'Planned';
        const canComplete = train.status === 'In Progress';
        const canViewSwitchList = train.switchList !== undefined;

        return (
          <Box display="flex" gap={0.5}>
            {canEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('edit', train)}
                  disabled={trainsLoading}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(train)}
                  disabled={trainsLoading}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canGenerate && (
              <Tooltip title="Generate Switch List">
                <IconButton
                  size="small"
                  onClick={() => handleActionClick('generate', train)}
                  disabled={trainsLoading}
                  color="primary"
                >
                  <PlayArrow fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canViewSwitchList && (
              <Tooltip title="View Switch List">
                <IconButton
                  size="small"
                  onClick={() => handleViewSwitchList(train)}
                  disabled={trainsLoading}
                >
                  <ViewList fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canComplete && (
              <Tooltip title="Complete Train">
                <IconButton
                  size="small"
                  onClick={() => handleActionClick('complete', train)}
                  disabled={trainsLoading}
                  color="success"
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {train.status !== 'Completed' && (
              <Tooltip title="Cancel Train">
                <IconButton
                  size="small"
                  onClick={() => handleActionClick('cancel', train)}
                  disabled={trainsLoading}
                  color="warning"
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  // Statistics
  const stats = {
    total: filteredTrains.length,
    planned: filteredTrains.filter(t => t.status === 'Planned').length,
    inProgress: filteredTrains.filter(t => t.status === 'In Progress').length,
    completed: filteredTrains.filter(t => t.status === 'Completed').length,
    cancelled: filteredTrains.filter(t => t.status === 'Cancelled').length,
  };

  if (trainsLoading && trains.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Train Operations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('add')}
          disabled={trainsLoading || !currentSession}
        >
          Add Train
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr' },
          gap: 2,
          mb: 3 
        }}
      >
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Total Trains
            </Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Planned
            </Typography>
            <Typography variant="h4">{stats.planned}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              In Progress
            </Typography>
            <Typography variant="h4" color="primary">{stats.inProgress}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Completed
            </Typography>
            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Cancelled
            </Typography>
            <Typography variant="h4" color="error.main">{stats.cancelled}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Session</InputLabel>
              <Select
                value={filters.sessionNumber}
                label="Session"
                onChange={(e) => setFilters({ ...filters, sessionNumber: e.target.value as number | 'all' })}
              >
                <MenuItem value="all">All Sessions</MenuItem>
                {currentSession && (
                  <MenuItem value={currentSession.currentSessionNumber}>
                    Session {currentSession.currentSessionNumber}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TrainStatus | 'all' })}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Route</InputLabel>
              <Select
                value={filters.routeId}
                label="Route"
                onChange={(e) => setFilters({ ...filters, routeId: e.target.value })}
              >
                <MenuItem value="all">All Routes</MenuItem>
                {routes.map((route) => (
                  <MenuItem key={route._id || route.id} value={route._id || route.id}>
                    {route.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={filteredTrains}
            columns={columns}
            getRowId={(row) => row._id || row.id!}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            loading={trainsLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'add' ? 'Add Train' : 'Edit Train'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Train Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Route</InputLabel>
              <Select
                value={formData.routeId}
                label="Route"
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
              >
                {routes.map((route) => (
                  <MenuItem key={route._id || route.id} value={route._id || route.id}>
                    {route.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Locomotives</InputLabel>
              <Select
                multiple
                value={formData.locomotiveIds}
                label="Locomotives"
                onChange={(e) => setFormData({ ...formData, locomotiveIds: e.target.value as string[] })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const loco = locomotives.find(l => (l._id || l.id) === value);
                      return <Chip key={value} label={loco ? `${loco.reportingMarks} ${loco.reportingNumber}` : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {locomotives.filter(l => l.isInService).map((loco) => (
                  <MenuItem key={loco._id || loco.id} value={loco._id || loco.id}>
                    {loco.reportingMarks} {loco.reportingNumber} - {loco.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Max Capacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={trainsLoading || !formData.name || !formData.routeId || formData.locomotiveIds.length === 0}
          >
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Train?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete train "{trainToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={trainsLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionConfirmOpen} onClose={() => setActionConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'generate' && 'Generate Switch List?'}
          {actionType === 'complete' && 'Complete Train?'}
          {actionType === 'cancel' && 'Cancel Train?'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {actionType === 'generate' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>This will:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Generate a switch list for train "{trainForAction?.name}"<br />
                  • Assign cars to pending orders<br />
                  • Change train status to "In Progress"<br />
                  • Update car order statuses to "assigned"
                </Typography>
              </>
            )}
            {actionType === 'complete' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>This will:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Complete train "{trainForAction?.name}"<br />
                  • Move all cars to their destinations<br />
                  • Update car order statuses to "delivered"<br />
                  • Change train status to "Completed"
                </Typography>
              </>
            )}
            {actionType === 'cancel' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>This will:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Cancel train "{trainForAction?.name}"<br />
                  • Revert car orders to "pending" status<br />
                  • Clear car assignments<br />
                  • Change train status to "Cancelled"
                </Typography>
              </>
            )}
          </Alert>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleActionConfirm}
            variant="contained"
            color={actionType === 'cancel' ? 'warning' : 'primary'}
            disabled={trainsLoading}
          >
            {actionType === 'generate' && 'Generate'}
            {actionType === 'complete' && 'Complete'}
            {actionType === 'cancel' && 'Cancel Train'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Switch List Dialog */}
      <Dialog open={switchListDialogOpen} onClose={() => setSwitchListDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Switch List - {trainForSwitchList?.name}
        </DialogTitle>
        <DialogContent>
          {trainForSwitchList?.switchList ? (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Summary
                </Typography>
                <Box display="flex" gap={3}>
                  <Typography variant="body2">
                    Total Pickups: {trainForSwitchList.switchList.totalPickups}
                  </Typography>
                  <Typography variant="body2">
                    Total Setouts: {trainForSwitchList.switchList.totalSetouts}
                  </Typography>
                  <Typography variant="body2">
                    Final Car Count: {trainForSwitchList.switchList.finalCarCount}
                  </Typography>
                </Box>
              </Paper>

              {trainForSwitchList.switchList.stations.map((station, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {station.stationName}
                  </Typography>
                  <Divider sx={{ my: 1 }} />

                  {station.pickups.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Pickups ({station.pickups.length})
                      </Typography>
                      <List dense>
                        {station.pickups.map((pickup, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={`${pickup.carReportingMarks} ${pickup.carNumber}`}
                              secondary={`${pickup.carType} → ${pickup.destinationIndustryName}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {station.setouts.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Setouts ({station.setouts.length})
                      </Typography>
                      <List dense>
                        {station.setouts.map((setout, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={`${setout.carReportingMarks} ${setout.carNumber}`}
                              secondary={`${setout.carType} → ${setout.destinationIndustryName}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography>No switch list available for this train.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitchListDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainOperations;
