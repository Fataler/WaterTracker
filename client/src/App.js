import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';
import { ThemeProvider, useTheme as useAppTheme } from './context/ThemeContext';
import { WaterProvider } from './context/WaterContext';
import axios from './utils/axios';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Calendar from './components/calendar/Calendar';
import AdminPanel from './components/admin/AdminPanel';
import Profile from './components/profile/Profile';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

const AppContent = () => {
  const { darkMode } = useAppTheme();
  const theme = getTheme(darkMode);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    window.updateAuthState = (authenticated, admin) => {
      setIsAuthenticated(authenticated);
      setIsAdmin(admin);
    };

    return () => {
      delete window.updateAuthState;
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = {
            headers: { 'x-auth-token': token }
          };
          const res = await axios.get('/api/users/me', config);
          setIsAuthenticated(true);
          setIsAdmin(res.data.role === 'admin');
        } catch (err) {
          console.error('Error checking auth:', err);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const mainContentStyle = {
    flexGrow: 1,
    width: '100%',
    mt: '64px',
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex' }}>
            <Navbar 
              onMenuClick={handleDrawerToggle} 
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              setIsAuthenticated={setIsAuthenticated}
              setIsAdmin={setIsAdmin}
            />
            {isAuthenticated && (
              <Sidebar
                open={mobileOpen}
                onClose={handleDrawerToggle}
                isAdmin={isAdmin}
              />
            )}
            <Box component="main" sx={mainContentStyle}>
              <Box 
                sx={{ 
                  py: 3,
                  px: { xs: 2, md: 0 },
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '100%',
                  margin: '0 auto',
                  width: '100%',
                  ...(!isAuthenticated && {
                    maxWidth: 'lg',
                    mx: 'auto',
                  }),
                  ...(isAuthenticated && {
                    maxWidth: { xs: '100%', md: 'none' },
                    px: { xs: 2, md: 3 },
                  }),
                }}
              >
                <Routes>
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <PrivateRoute>
                        <Calendar />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPanel />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <WaterProvider>
        <AppContent />
      </WaterProvider>
    </ThemeProvider>
  );
};

export default App;
