import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Box, Button, Container, Typography, TextField, Paper, Alert, Grid, Divider } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Layout from '../../components/Layout';

export default function SplitSlot() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // For the April 13-14 specific slot
  const april13_6pm = new Date(2025, 3, 13, 18, 0, 0); // April 13, 2025, 6:00 PM
  const april14_1140am = new Date(2025, 3, 14, 11, 40, 0); // April 14, 2025, 11:40 AM

  useEffect(() => {
    // Get token from local storage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }

    // Get calendar ID from URL query if available
    if (router.query.calendarId) {
      setCalendarId(router.query.calendarId);
    }
  }, [router.query]);

  const handleSplitSpecificSlot = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('/api/calendar/split-specific-slot', {
        calendarId,
        token
      });
      
      setSuccess(true);
      setMessage('Successfully split April 13-14 slot!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error splitting slot');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitOvernightSlot = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.post('/api/calendar/split-overnight-slot', {
        calendarId,
        token,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });
      
      setSuccess(true);
      setMessage('Successfully split overnight slot!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error splitting slot