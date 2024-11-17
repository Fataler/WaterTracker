import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from '../../utils/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '',
    dailyWaterGoal: 2000
  });
  const [error, setError] = useState('');

  const { 
    username, 
    email, 
    password, 
    password2, 
    firstName, 
    lastName, 
    middleName, 
    gender,
    dailyWaterGoal 
  } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    const registrationData = {
      username,
      email,
      password,
      firstName,
      lastName,
      middleName,
      gender,
      dailyWaterGoal
    };

    console.log('=== Registration Attempt ===');
    console.log('Data being sent:', {
      ...registrationData,
      password: '[HIDDEN]'
    });

    try {
      const res = await axios.post('/api/auth/register', registrationData);
      console.log('Registration successful, received token');

      localStorage.setItem('token', res.data.token);
      
      const config = {
        headers: { 'x-auth-token': res.data.token }
      };
      console.log('Fetching user data...');
      const userRes = await axios.get('/api/users/me', config);
      console.log('User data received:', {
        id: userRes.data.id,
        role: userRes.data.role,
        username: userRes.data.username
      });
      
      if (window.updateAuthState) {
        window.updateAuthState(true, userRes.data.role === 'admin');
      }

      navigate('/');
    } catch (err) {
      console.error('=== Registration Error ===');
      console.error('Error details:', err.response || err);
      
      const responseData = err.response?.data;
      console.log('Server response:', responseData);

      let errorMessages = [];

      if (responseData?.errors) {
        console.log('Validation errors:', responseData.errors);
        errorMessages = responseData.errors.map(e => e.msg);
      } else if (responseData?.msg) {
        errorMessages = [responseData.msg];
      } else {
        errorMessages = ['An error occurred during registration'];
      }

      if (responseData?.receivedFields) {
        console.log('=== Field Analysis ===');
        console.log('Received fields:', responseData.receivedFields);
        console.log('Required fields:', responseData.requiredFields);
        
        const missingFields = responseData.missingFields || 
          responseData.requiredFields?.filter(
            field => !responseData.receivedFields.includes(field)
          ) || [];
        
        if (missingFields.length > 0) {
          console.log('Missing fields:', missingFields);
          errorMessages.push(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }

      setError(errorMessages.join('\n'));
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Register
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password2"
            label="Confirm Password"
            type="password"
            id="password2"
            autoComplete="new-password"
            value={password2}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="firstName"
            label="First Name"
            id="firstName"
            value={firstName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="lastName"
            label="Last Name"
            id="lastName"
            value={lastName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            name="middleName"
            label="Middle Name (Optional)"
            id="middleName"
            value={middleName}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={gender}
              label="Gender"
              onChange={handleChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            name="dailyWaterGoal"
            label="Daily Water Goal (ml)"
            type="number"
            id="dailyWaterGoal"
            value={dailyWaterGoal}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
