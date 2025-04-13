import React, { useState } from 'react';
import axios from 'axios';

const SharedCalendarView = ({ availableSlots }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Group slots by day properly
  const slotsByDay = availableSlots.reduce((acc, slot) => {
    const date = new Date(slot.start);
    // Get the date portion only (YYYY-MM-DD)
    const dayKey = date.toISOString().split('T')[0];
    
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    
    acc[dayKey].push(slot);
    return acc;
  }, {});

  // Format time function
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Function to check if a slot spans across midnight (overnight)
  const isOvernightSlot = (slot) => {
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    
    return (
      startDate.getDate() !== endDate.getDate() || 
      startDate.getMonth() !== endDate.getMonth() || 
      startDate.getFullYear() !== endDate.getFullYear()
    );
  };

  // Function to handle splitting an overnight slot
  const handleSplitOvernightSlot = async (slot) => {
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('Authentication required. Please log in again.');
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      // Call the API to split the overnight slot
      await axios.post('/api/calendar/split-overnight-slot', {
        slotId: slot.id,
        token
      });
      
      setMessage('Slot successfully split at midnight');
      setMessageType('success');
      
      // Force page refresh to show the updated slots
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error splitting overnight slot:', error);
      setMessage(error.response?.data?.message || 'Failed to split slot');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          <div>
            <span>{message}</span>
          </div>
        </div>
      )}
      
      {Object.keys(slotsByDay).length > 0 ? (
        Object.keys(slotsByDay).sort().map(day => (
          <div key={day} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-medium">
              {formatDate(day)}
            </div>
            <ul className="divide-y divide-gray-200">
              {slotsByDay[day].map((slot, index) => (
                <li key={index} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{formatTime(slot.start)}</span>
                      <span className="mx-2">-</span>
                      <span className="font-medium">{formatTime(slot.end)}</span>
                      
                      {/* We don't need overnight indicators anymore since slots are auto-split */}
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500">
                        {Math.round(slot.duration)} min
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No available slots found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default SharedCalendarView;
