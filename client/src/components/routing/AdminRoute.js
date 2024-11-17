import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../../utils/axios';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const config = {
          headers: { 'x-auth-token': token }
        };

        const res = await axios.get('/api/users/me', config);
        setIsAdmin(res.data.role === 'admin');
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
