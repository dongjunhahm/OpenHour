import React, { useState } from 'react';
import axios from 'axios';

const SharedCalendarView = ({ availableSlots }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventName, setEventName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

  // Function to handle clicking a time slot
  const handleSlotClick = (slot) => {
    // Convert slot times to ISO strings that work with datetime-local input
    const startDateTime = new Date(slot.start);
    const endDateTime = new Date(slot.end);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatForInput = (date) => {
      return date.toISOString().slice(0, 16);
    };
    
    setSelectedSlot(slot);
    setEventName('');
    setStartTime(formatForInput(startDateTime));
    setEndTime(formatForInput(endDateTime));
    setShowModal(true);
  };

  // Function to add event to Google Calendar
  const handleAddToCalendar = async () => {
    if (!eventName || !startTime || !endTime) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      // Get token from localStorage or Redux
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('Authentication required. Please log in again.');
        setMessageType('error');
        setLoading(false);
        return;
      }
      
      // Get calendar ID from URL
      const urlParts = window.location.pathname.split('/');
      const calendarId = urlParts[urlParts.length - 1];
      
      // Call API to add event to Google Calendar
      const response = await axios.post('/api/calendar/add-google-event', {
        token,
        calendarId,
        eventName,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      });
      
      setMessage('Event successfully added to your Google Calendar!');
      setMessageType('success');
      setShowModal(false);
      
      // Keep the success message visible after modal closes
      setTimeout(() => {
        setMessage('');
      }, 5000); // Hide after 5 seconds
      
    } catch (error) {
      console.error('Error adding event to Google Calendar:', error);
      setMessage(error.response?.data?.message || 'Failed to add event to calendar');
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
                <li 
                  key={index} 
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSlotClick(slot)}
                >
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
      
      {/* Event Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Event to Calendar</h3>
            
            {message && (
              <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
                <div>
                  <span>{message}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={startTime}
                  max={endTime}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>This event will be added to your Google Calendar.</p>
                <p>Other participants will be invited automatically.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddToCalendar}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Add to Calendar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCalendarView;
