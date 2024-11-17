import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import axios from '../../utils/axios';
import { useWater } from '../../context/WaterContext';

const Calendar = () => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterIntake, setWaterIntake] = useState([]);
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { shouldRefresh } = useWater();

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token }
        };

        const res = await axios.get(`/api/water/range/${start}/${end}`, config);
        const dataByDate = {};
        res.data.forEach(record => {
          const date = record.date;
          if (!dataByDate[date]) {
            dataByDate[date] = 0;
          }
          dataByDate[date] += record.amount;
        });
        setMonthlyData(dataByDate);
      } catch (err) {
        console.error('Error fetching monthly data:', err);
        setError('Failed to load monthly data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedDate, shouldRefresh]);

  useEffect(() => {
    fetchWaterIntake();
  }, [selectedDate, shouldRefresh]);

  const fetchWaterIntake = async () => {
    try {
      setLoading(true);
      setError('');
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };

      const res = await axios.get(`/api/water/date/${formattedDate}`, config);
      setWaterIntake(res.data);
    } catch (err) {
      console.error('Error fetching water intake:', err);
      setError('Failed to load water intake data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalIntake = () => {
    return waterIntake.reduce((total, record) => total + record.amount, 0);
  };

  const getDayColor = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dailyGoal = 2000;
    const total = monthlyData[formattedDate] || 0;
    
    if (total >= dailyGoal) {
      return theme.palette.success.main;
    } else if (total > 0) {
      return theme.palette.warning.main;
    }
    return 'transparent';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Water Intake Calendar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              sx={{
                width: '100%',
                maxWidth: 360,
                '.MuiPickersCalendarHeader-root': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pl: 2,
                  pr: 2,
                }
              }}
              slots={{
                day: (props) => {
                  const dayColor = getDayColor(props.day);
                  return (
                    <PickersDay
                      {...props}
                      sx={{
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '80%',
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: dayColor,
                          opacity: 0.6,
                        }
                      }}
                    />
                  );
                }
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Water Intake for {format(selectedDate, 'MMMM d, yyyy')}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Total Intake: {getTotalIntake()} ml
                </Typography>

                <Box sx={{ mt: 2, flex: 1, overflow: 'auto' }}>
                  {waterIntake.length > 0 ? (
                    waterIntake.map((record, index) => (
                      <Paper
                        key={index}
                        elevation={1}
                        sx={{
                          p: 2,
                          mb: 1,
                          backgroundColor: theme.palette.background.default,
                        }}
                      >
                        <Typography>
                          Time: {record.time}
                        </Typography>
                        <Typography>
                          Amount: {record.amount} ml
                        </Typography>
                      </Paper>
                    ))
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 4,
                      }}
                    >
                      <Typography color="textSecondary" gutterBottom>
                        No water intake records for this day
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Try adding some water intake records to track your hydration
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Calendar;
