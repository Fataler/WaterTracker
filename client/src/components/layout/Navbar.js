import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  LocalDrink as WaterIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const Navbar = ({ 
  onMenuClick, 
  isAuthenticated, 
  isAdmin, 
  setIsAuthenticated, 
  setIsAdmin 
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { darkMode, toggleDarkMode } = useAppTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setIsAdmin(false);
      navigate('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
      setLogoutDialog(false);
    }
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: 64,
        }}
      >
        <Toolbar>
          {isAuthenticated && isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <WaterIcon sx={{ mr: 1 }} />
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to={isAuthenticated ? "/" : "/login"} 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Water Tracker
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                color="inherit"
                onClick={toggleDarkMode}
                sx={{ ml: 1 }}
              >
                {darkMode ? <LightIcon /> : <DarkIcon />}
              </IconButton>
            </Tooltip>

            {!isAuthenticated ? (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                  sx={{ ml: 1 }}
                >
                  Login
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  Register
                </Button>
              </>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => setLogoutDialog(true)}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Logout'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog
        open={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          Are you sure you want to log out?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleLogout} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
