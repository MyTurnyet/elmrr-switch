import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  Factory as IndustryIcon,
  Route as RouteIcon,
  CloudUpload as ImportIcon,
  Train as TrainIcon,
  CalendarMonth as SessionIcon,
  Assignment as OrderIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuSections = [
    {
      title: null,
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { text: 'Session Management', icon: <SessionIcon />, path: '/sessions' },
        { text: 'Train Operations', icon: <TrainIcon />, path: '/trains' },
        { text: 'Car Orders', icon: <OrderIcon />, path: '/orders' },
      ]
    },
    {
      title: 'Setup',
      items: [
        { text: 'Car Management', icon: <CarIcon />, path: '/cars' },
        { text: 'Industries', icon: <IndustryIcon />, path: '/industries' },
        { text: 'Routes', icon: <RouteIcon />, path: '/routes' },
        { text: 'Data Import', icon: <ImportIcon />, path: '/import' },
      ]
    }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrainIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" noWrap component="div" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            ELMRR
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      {menuSections.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          <List
            subheader={
              section.title ? (
                <ListSubheader component="div" sx={{ bgcolor: 'transparent', fontWeight: 600 }}>
                  {section.title}
                </ListSubheader>
              ) : undefined
            }
          >
            {section.items.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light + '20',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light + '30',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: location.pathname === item.path ? 600 : 400 
                      } 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {sectionIndex < menuSections.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Model Railroad Layout Tracking System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
