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
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { cars, locomotives, industries, loading, error, fetchData } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const recentActivity = [
    { id: '1', type: 'info', message: 'System initialized successfully', time: 'Just now' },
    { id: '2', type: 'success', message: 'Ready to import data', time: '1 minute ago' },
  ];

  const quickActions = [
    { label: 'Import Data', path: '/import', color: 'primary' as const },
    { label: 'Manage Cars', path: '/cars', color: 'secondary' as const },
    { label: 'View Industries', path: '/industries', color: 'success' as const },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

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
                  System Status
                </Typography>
                <Typography variant="h6" component="h2" color="success.main">
                  Online
                </Typography>
                <Chip 
                  label="Ready" 
                  size="small" 
                  color="success"
                  sx={{ mt: 1 }}
                />
              </Box>
              <CheckCircle color="success" sx={{ fontSize: 40 }} />
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
