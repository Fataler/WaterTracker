import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import axios from '../../utils/axios';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterRecords, setWaterRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // Состояние для новой/редактируемой записи
  const [recordForm, setRecordForm] = useState({
    amount: '',
    time: '',
  });

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token }
        };
        const res = await axios.get('/api/users', config);
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  // Загрузка записей о воде
  useEffect(() => {
    if (selectedUser && selectedDate) {
      fetchWaterRecords();
    }
  }, [selectedUser, selectedDate]);

  const fetchWaterRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const res = await axios.get(`/api/water/admin/${selectedUser}/date/${formattedDate}`, config);
      setWaterRecords(res.data);
    } catch (err) {
      console.error('Error fetching water records:', err);
      setError('Failed to load water records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditRecord(null);
    setRecordForm({ amount: '', time: '' });
    setOpenDialog(true);
  };

  const handleEditRecord = (record) => {
    setEditRecord(record);
    setRecordForm({
      amount: record.amount,
      time: record.time,
    });
    setOpenDialog(true);
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };
      await axios.delete(`/api/water/admin/${recordId}`, config);
      fetchWaterRecords();
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record');
    }
  };

  const handleSubmitRecord = async () => {
    try {
      if (!recordForm.amount || !recordForm.time || !selectedUser) {
        setError('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };

      const data = {
        userId: selectedUser,
        amount: parseInt(recordForm.amount, 10),
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: recordForm.time + ':00'
      };

      if (editRecord) {
        await axios.put(`/api/water/admin/${editRecord.id}`, data, config);
      } else {
        await axios.post('/api/water/admin', data, config);
      }

      setOpenDialog(false);
      setRecordForm({ amount: '', time: '' });
      fetchWaterRecords();
    } catch (err) {
      console.error('Error saving record:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.msg || 'Failed to save record');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Select User"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRecord}
            disabled={!selectedUser}
          >
            Add Record
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Amount (ml)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {waterRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.time}</TableCell>
                <TableCell>{record.amount}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditRecord(record)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteRecord(record.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        aria-labelledby="water-record-dialog-title"
        disableEnforceFocus
        container={() => document.getElementById('modal-root')}
      >
        <DialogTitle id="water-record-dialog-title">
          {editRecord ? 'Edit Water Record' : 'Add Water Record'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Amount (ml)"
            type="number"
            value={recordForm.amount}
            onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Time"
            type="time"
            value={recordForm.time}
            onChange={(e) => setRecordForm({ ...recordForm, time: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              step: 300, // 5 минут
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitRecord} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
