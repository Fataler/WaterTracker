import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Box,
  ListItemButton,
} from '@mui/material';
import {
  LocalDrink as WaterIcon,
  CalendarMonth as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';

const Sidebar = ({ open, onClose, isAdmin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <WaterIcon />, path: '/' },
    { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];

  if (isAdmin) {
    menuItems.push({ text: 'Admin', icon: <AdminIcon />, path: '/admin' });
  }

  const drawerContent = (
    <Box sx={{ mt: '64px' }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 2,
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: 240 },
        flexShrink: { md: 0 },
        display: { xs: 'none', md: 'block' }
      }}
    >
      {/* Постоянный сайдбар для десктопа */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Временный сайдбар для мобильных устройств */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
