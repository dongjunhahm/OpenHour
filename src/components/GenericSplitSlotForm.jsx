import React, { useState } from 'react';
import axios from 'axios';

const GenericSplitSlotForm = ({ calendarId, token, refreshSlots }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  const splitSlot = async (e) => {
    e.preventDefault();
    
    if (!startDateTime || !endDateTime) {
      setError('Please provide both start and end times');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/calendar/split-overnight-slot', {
        calendarId,
        token,
        originalSlotStart: startDateTime,
        originalSlotEnd: endDateTime
      });

      setSuccess('Successfully split the time slot!');
      
      // Reset form
      setStartDateTime('');
      setEndDateTime('');
      
      // Refresh the slots if a refresh function was provided
      if (refreshSlots && typeof refreshSlots === 'function') {
        refreshSlots();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while splitting the slot');
      console.error('Error splitting slot:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3">Split Time Slot at Midnight</h3>
      
      <form onSubmit={splitSlot}>
        <div className="mb-3">
          <label className="block mb-1">Start Date and Time:</label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block mb-1">End Date and Time:</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !startDateTime || !endDateTime}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Processing...' : 'Split at Midnight'}
        </button>
      </form>
      
      {error && (
        <div className="mt-2 text-red-500">{error}</div>
      )}
      
      {success && (
        <div className="mt-2 text-green-500">{success}</div>
      )}
    </div>
  );
};

export default GenericSplitSlotForm;
