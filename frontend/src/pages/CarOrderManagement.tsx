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
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useApp } from '../contexts/AppContext';
import type { CarOrder, CarOrderStatus, CarOrderGenerationRequest } from '../types';

interface OrderFilters {
  industryId: string | 'all';
  status: CarOrderStatus | 'all';
  sessionNumber: number | 'all';
  aarTypeId: string | 'all';
}

const CarOrderManagement: React.FC = () => {
  const {
    carOrders,
    industries,
    aarTypes,
    cars,
    trains,
    currentSession,
    ordersLoading,
    error,
    fetchCurrentSession,
    fetchCarOrders,
    deleteCarOrder,
    generateCarOrders,
  } = useApp();

  const [filters, setFilters] = useState<OrderFilters>({
    industryId: 'all',
    status: 'all',
    sessionNumber: 'all',
    aarTypeId: 'all',
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<CarOrder | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<CarOrderGenerationRequest>({
    sessionNumber: undefined,
    force: false,
  });

  useEffect(() => {
    fetchCurrentSession();
    fetchCarOrders();
  }, [fetchCurrentSession, fetchCarOrders]);

  // Update generate request when session changes
  useEffect(() => {
    if (currentSession) {
      setGenerateRequest({
        sessionNumber: currentSession.currentSessionNumber,
        force: false,
      });
    }
  }, [currentSession]);

  // Filter orders
  const filteredOrders = carOrders.filter((order) => {
    if (filters.industryId !== 'all' && order.industryId !== filters.industryId) {
      return false;
    }
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    if (filters.sessionNumber !== 'all' && order.sessionNumber !== filters.sessionNumber) {
      return false;
    }
    if (filters.aarTypeId !== 'all' && order.aarTypeId !== filters.aarTypeId) {
      return false;
    }
    return true;
  });

  // Get status color
  const getStatusColor = (status: CarOrderStatus): 'default' | 'primary' | 'warning' | 'success' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'assigned':
        return 'primary';
      case 'in-transit':
        return 'warning';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  // Handle delete
  const handleDeleteClick = (order: CarOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (orderToDelete) {
      try {
        await deleteCarOrder(orderToDelete._id || orderToDelete.id!);
        setDeleteConfirmOpen(false);
        setOrderToDelete(null);
        await fetchCarOrders();
      } catch (err) {
        // Error handled by AppContext
      }
    }
  };

  // Handle generate orders
  const handleGenerateClick = () => {
    setGenerateDialogOpen(true);
  };

  const handleGenerateConfirm = async () => {
    try {
      await generateCarOrders(generateRequest);
      setGenerateDialogOpen(false);
      await fetchCarOrders();
    } catch (err) {
      // Error handled by AppContext
    }
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'industryName',
      headerName: 'Industry',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => {
        const industry = industries.find(i => (i._id || i.id) === row.industryId);
        return industry?.name || 'Unknown';
      },
    },
    {
      field: 'goodsDirection',
      headerName: 'Goods / Direction',
      width: 180,
      renderCell: (params) => {
        const order = params.row as CarOrder;
        if (!order.goodsId || !order.direction) {
          return <Typography variant="body2" color="text.secondary">-</Typography>;
        }
        const directionColor = order.direction === 'inbound' ? 'primary' : 'secondary';
        const directionLabel = order.direction === 'inbound' ? '↓ IN' : '↑ OUT';
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip 
              label={directionLabel} 
              color={directionColor} 
              size="small" 
              sx={{ minWidth: 50 }}
            />
            <Typography variant="body2" noWrap>
              {order.goodsId}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'aarTypeName',
      headerName: 'Car Type',
      width: 120,
      valueGetter: (_value, row) => {
        const aarType = aarTypes.find(a => (a._id || a.id) === row.aarTypeId);
        return aarType?.initial || 'Unknown';
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
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value as CarOrderStatus)}
          size="small"
        />
      ),
    },
    {
      field: 'assignedCar',
      headerName: 'Assigned Car',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row) => {
        if (!row.assignedCarId) return 'Not assigned';
        const car = cars.find(c => (c._id || c.id) === row.assignedCarId);
        return car ? `${car.reportingMarks} ${car.reportingNumber}` : 'Unknown';
      },
    },
    {
      field: 'assignedTrain',
      headerName: 'Train',
      width: 150,
      valueGetter: (_value, row) => {
        if (!row.assignedTrainId) return '-';
        const train = trains.find(t => (t._id || t.id) === row.assignedTrainId);
        return train?.name || 'Unknown';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const order = params.row as CarOrder;
        const canDelete = order.status === 'pending';

        return (
          <Box display="flex" gap={0.5}>
            {canDelete && (
              <Tooltip title="Delete Order">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(order)}
                  disabled={ordersLoading}
                  color="error"
                >
                  <Delete fontSize="small" />
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
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    assigned: filteredOrders.filter(o => o.status === 'assigned').length,
    inTransit: filteredOrders.filter(o => o.status === 'in-transit').length,
    delivered: filteredOrders.filter(o => o.status === 'delivered').length,
  };

  if (ordersLoading && carOrders.length === 0) {
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
          Car Order Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchCarOrders()}
            disabled={ordersLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleGenerateClick}
            disabled={ordersLoading || !currentSession}
          >
            Generate Orders
          </Button>
        </Stack>
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
              Total Orders
            </Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Pending
            </Typography>
            <Typography variant="h4">{stats.pending}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Assigned
            </Typography>
            <Typography variant="h4" color="primary">{stats.assigned}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              In Transit
            </Typography>
            <Typography variant="h4" color="warning.main">{stats.inTransit}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom variant="body2">
              Delivered
            </Typography>
            <Typography variant="h4" color="success.main">{stats.delivered}</Typography>
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Industry</InputLabel>
              <Select
                value={filters.industryId}
                label="Industry"
                onChange={(e) => setFilters({ ...filters, industryId: e.target.value })}
              >
                <MenuItem value="all">All Industries</MenuItem>
                {industries.map((industry) => (
                  <MenuItem key={industry._id || industry.id} value={industry._id || industry.id}>
                    {industry.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value as CarOrderStatus | 'all' })}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in-transit">In Transit</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
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
              <InputLabel>Car Type</InputLabel>
              <Select
                value={filters.aarTypeId}
                label="Car Type"
                onChange={(e) => setFilters({ ...filters, aarTypeId: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                {aarTypes.map((type) => (
                  <MenuItem key={type._id || type.id} value={type._id || type.id}>
                    {type.initial} - {type.name}
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
            rows={filteredOrders}
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
            loading={ordersLoading}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Car Order?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this car order? This action cannot be undone.
          </Typography>
          {orderToDelete && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="body2">
                <strong>Industry:</strong> {industries.find(i => (i._id || i.id) === orderToDelete.industryId)?.name || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Car Type:</strong> {aarTypes.find(a => (a._id || a.id) === orderToDelete.aarTypeId)?.initial || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Session:</strong> {orderToDelete.sessionNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {orderToDelete.status}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={ordersLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Orders Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Car Orders</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will generate car orders based on industry demand configurations for the selected session.
          </Alert>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Session Number"
              type="number"
              value={generateRequest.sessionNumber || ''}
              onChange={(e) => setGenerateRequest({ ...generateRequest, sessionNumber: parseInt(e.target.value) || undefined })}
              fullWidth
              helperText="Leave empty to use current session"
            />
            <FormControl fullWidth>
              <InputLabel>Force Generation</InputLabel>
              <Select
                value={generateRequest.force ? 'true' : 'false'}
                label="Force Generation"
                onChange={(e) => setGenerateRequest({ ...generateRequest, force: e.target.value === 'true' })}
              >
                <MenuItem value="false">No - Skip duplicates</MenuItem>
                <MenuItem value="true">Yes - Generate even if duplicates exist</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateConfirm}
            variant="contained"
            disabled={ordersLoading}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarOrderManagement;
