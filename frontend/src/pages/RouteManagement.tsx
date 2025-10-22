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

const RouteManagement: React.FC = () => {
  const {
    routes,
    industries,
    loading,
    error,
    fetchData,
  } = useApp();

  const [filters, setFilters] = useState<RouteFilters>({
    search: '',
    originYard: 'all',
    terminationYard: 'all',
    stationCount: 'all',
  });

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

  const handleViewRoute = (route: Route) => {
    // TODO: Step 10 - Implement view route dialog
    console.log('View route:', route);
    alert('View route dialog coming in Step 10!');
  };

  const handleEditRoute = (route: Route) => {
    // TODO: Step 9 - Implement edit route dialog
    console.log('Edit route:', route);
    alert('Edit route dialog coming in Step 9!');
  };

  const handleAddRoute = () => {
    // TODO: Step 9 - Implement add route dialog
    alert('Add route dialog coming in Step 9!');
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
    </Box>
  );
};

export default RouteManagement;
