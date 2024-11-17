import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { LocalDrink as WaterIcon } from '@mui/icons-material';
import axios from '../../utils/axios';
import { format } from 'date-fns';

const Dashboard = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const fetchTodayIntake = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };

      // Используем текущую дату
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      console.log('Fetching data for date:', formattedDate);

      const waterRes = await axios.get(`/api/water/date/${formattedDate}`, config);
      console.log('Received water data:', waterRes.data);

      if (waterRes.data && Array.isArray(waterRes.data)) {
        const totalAmount = waterRes.data.reduce((sum, record) => sum + parseInt(record.amount, 10), 0);
        setWaterIntake(totalAmount);
      }
    } catch (err) {
      console.error('Error fetching today\'s intake:', err);
      setError('Failed to load today\'s data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token }
        };

        // Get user profile for daily goal
        const profileRes = await axios.get('/api/users/me', config);
        setDailyGoal(profileRes.data.dailyWaterGoal);

        // Get today's water intake
        await fetchTodayIntake();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddWater = async () => {
    try {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };

      // Отправляем только новое количество воды
      await axios.post('/api/water', {
        amount: Number(amount)
      }, config);

      // Обновляем данные с сервера
      await fetchTodayIntake();
      setAmount('');
      setError('');
    } catch (err) {
      console.error('Error adding water:', err);
      setError(err.response?.data?.msg || 'Failed to update water intake');
    }
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
      </Container>
    );
  }

  const progress = (waterIntake / dailyGoal) * 100;

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Today's Water Intake
            </Typography>

            {error && (
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
            )}

            <Box
              sx={{
                width: '100%',
                mb: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  width: 200,
                  height: 200,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Typography variant="h4" component="div">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <CircularProgress
                  variant="determinate"
                  value={Math.min(100, progress)}
                  size={200}
                  thickness={4}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                {waterIntake} ml / {dailyGoal} ml
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                width: '100%',
                maxWidth: 400,
              }}
            >
              <TextField
                type="number"
                label="Amount (ml)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                variant="outlined"
                error={!!error}
                helperText={error}
              />
              <Button
                variant="contained"
                onClick={handleAddWater}
                startIcon={<WaterIcon />}
                disabled={!amount}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
