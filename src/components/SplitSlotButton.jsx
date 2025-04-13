import React, { useState } from 'react';
import axios from 'axios';

const SplitSlotButton = ({ calendarId, token, refreshSlots }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const splitSpecificSlot = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/calendar/split-specific-slot', {
        calendarId,
        token
      });

      setSuccess('Successfully split the April 13-14 slot!');
      
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
    <div className="mt-4">
      <button
        onClick={splitSpecificSlot}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {isLoading ? 'Processing...' : 'Split April 13-14 Overnight Slot'}
      </button>
      
      {error && (
        <div className="mt-2 text-red-500">{error}</div>
      )}
      
      {success && (
        <div className="mt-2 text-green-500">{success}</div>
      )}
    </div>
  );
};

export default SplitSlotButton;
