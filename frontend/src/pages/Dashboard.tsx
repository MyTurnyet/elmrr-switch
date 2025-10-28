import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  DirectionsCar,
  Train,
  Factory,
  Route as RouteIcon,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { 
    cars, 
    locomotives, 
    industries, 
    routes, 
    trains,
    carOrders,
    currentSession,
    loading, 
    error, 
    fetchData,
    fetchCurrentSession,
    fetchTrains,
    fetchCarOrders,
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchCurrentSession();
    fetchTrains();
    fetchCarOrders();
  }, [fetchData, fetchCurrentSession, fetchTrains, fetchCarOrders]);

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

  const carsInService = cars.filter(car => car.isInService).length;
  const locomotivesInService = locomotives.filter(loco => loco.isInService).length;
  const totalIndustries = industries.length;

  // Train statistics
  const trainsThisSession = currentSession 
    ? trains.filter(t => t.sessionNumber === currentSession.currentSessionNumber).length
    : trains.length;
  const trainsPlanned = trains.filter(t => t.status === 'Planned').length;
  const trainsInProgress = trains.filter(t => t.status === 'In Progress').length;
  const trainsCompleted = trains.filter(t => t.status === 'Completed').length;

  // Car order statistics
  const ordersThisSession = currentSession
    ? carOrders.filter(o => o.sessionNumber === currentSession.currentSessionNumber).length
    : carOrders.length;
  const ordersPending = carOrders.filter(o => o.status === 'pending').length;
  const ordersAssigned = carOrders.filter(o => o.status === 'assigned').length;
  const ordersDelivered = carOrders.filter(o => o.status === 'delivered').length;
  const fulfillmentRate = ordersThisSession > 0 
    ? Math.round((ordersDelivered / ordersThisSession) * 100) 
    : 0;

  const recentActivity = [
    { id: '1', type: 'info', message: 'System initialized successfully', time: 'Just now' },
    { id: '2', type: 'success', message: 'Ready to import data', time: '1 minute ago' },
  ];

  const quickActions = [
    { label: 'Session Management', path: '/sessions', color: 'primary' as const },
    { label: 'Train Operations', path: '/trains', color: 'secondary' as const },
    { label: 'Car Orders', path: '/orders', color: 'success' as const },
    { label: 'Import Data', path: '/import', color: 'info' as const },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Current Session Card */}
      {currentSession && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Operating Session
                </Typography>
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                  Session {currentSession.currentSessionNumber}
                </Typography>
                {currentSession.description && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {currentSession.description}
                  </Typography>
                )}
              </Box>
              <Button
                variant="contained"
                color="inherit"
                onClick={() => navigate('/sessions')}
                sx={{ color: 'primary.main', bgcolor: 'background.paper' }}
              >
                Manage Session
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Cars
                </Typography>
                <Typography variant="h4" component="h2">
                  {cars.length}
                </Typography>
                <Chip 
                  label={`${carsInService} in service`} 
                  size="small" 
                  color={carsInService > 0 ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
              <DirectionsCar color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Locomotives
                </Typography>
                <Typography variant="h4" component="h2">
                  {locomotives.length}
                </Typography>
                <Chip 
                  label={`${locomotivesInService} in service`} 
                  size="small" 
                  color={locomotivesInService > 0 ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Train color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Industries
                </Typography>
                <Typography variant="h4" component="h2">
                  {totalIndustries}
                </Typography>
                <Chip 
                  label="Active" 
                  size="small" 
                  color="success"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Factory color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Routes
                </Typography>
                <Typography variant="h4" component="h2">
                  {routes.length}
                </Typography>
                <Chip
                  label="Configured"
                  size="small"
                  color={routes.length > 0 ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
              <RouteIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Train Operations & Car Orders Section */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4 
        }}
      >
        {/* Trains Card */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Train Operations
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/trains')}
                sx={{ textTransform: 'none' }}
              >
                View All →
              </Button>
            </Box>
            <Typography variant="h3" component="div" gutterBottom>
              {trainsThisSession}
            </Typography>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              Trains this session
            </Typography>
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Chip 
                label={`${trainsPlanned} Planned`} 
                size="small" 
                color="default"
              />
              <Chip 
                label={`${trainsInProgress} In Progress`} 
                size="small" 
                color="primary"
              />
              <Chip 
                label={`${trainsCompleted} Completed`} 
                size="small" 
                color="success"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Car Orders Card */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Car Orders
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/orders')}
                sx={{ textTransform: 'none' }}
              >
                View All →
              </Button>
            </Box>
            <Typography variant="h3" component="div" gutterBottom>
              {ordersThisSession}
            </Typography>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              Orders this session
            </Typography>
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              <Chip 
                label={`${ordersPending} Pending`} 
                size="small" 
                color="default"
              />
              <Chip 
                label={`${ordersAssigned} Assigned`} 
                size="small" 
                color="primary"
              />
              <Chip 
                label={`${fulfillmentRate}% Fulfilled`} 
                size="small" 
                color="success"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3 
        }}
      >
        {/* Quick Actions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outlined"
                color={action.color}
                onClick={() => navigate(action.path)}
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Recent Activity */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {recentActivity.map((activity) => (
              <ListItem key={activity.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  {activity.type === 'success' ? (
                    <CheckCircle color="success" />
                  ) : activity.type === 'warning' ? (
                    <Warning color="warning" />
                  ) : (
                    <TrendingUp color="info" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={activity.message}
                  secondary={activity.time}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Getting Started Section */}
      {cars.length === 0 && (
        <Box sx={{ mt: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to ELMRR Switch!
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Get started by importing your existing JSON data files or manually adding cars and industries.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/import')}
              sx={{ mr: 2 }}
            >
              Import Data
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/cars')}
            >
              Add Cars Manually
            </Button>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
