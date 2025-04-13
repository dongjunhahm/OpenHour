import { useState } from 'react';
import TimeRangeSlider from './TimeRangeSlider';

const EventCreationOverlay = ({ onClose, selectedDate, calendarId, onEventCreated }) => {
  // Set default times for the current date (9 AM to 5 PM)
  const defaultStartTime = new Date(selectedDate);
  defaultStartTime.setHours(9, 0, 0);
  
  const defaultEndTime = new Date(selectedDate);
  defaultEndTime.setHours(17, 0, 0);
  
  const [eventDetails, setEventDetails] = useState({
    eventName: '',
    description: '',
    startTime: defaultStartTime,
    endTime: defaultEndTime,
  });
  
  const [overlayState, setOverlayState] = useState('input'); // 'input', 'loading', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle time range changes from the slider
  const handleTimeRangeChange = ({ startTime, endTime }) => {
    setEventDetails(prev => ({
      ...prev,
      startTime,
      endTime
    }));
  };
  
  // Format date for display
  const formatDateDisplay = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!eventDetails.eventName.trim()) {
      setErrorMessage('Event name cannot be empty');
      return;
    }
    
    setOverlayState('loading');
    
    // Get token from your auth system (this will depend on your app's auth setup)
    // For example, you might get it from localStorage or a Redux store
    const token = localStorage.getItem('googleToken') || '';
    
    // Prepare data for API call
    const eventData = {
      token,
      calendarId,
      eventName: eventDetails.eventName,  // This needs to match what the API expects
      description: eventDetails.description,
      startTime: eventDetails.startTime.toISOString(),
      endTime: eventDetails.endTime.toISOString()
    };
    
    console.log('Submitting event data:', eventData);
    
    try {
      const response = await fetch('/api/calendar/add-google-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Notify parent that event was created
        if (onEventCreated) onEventCreated(data);
        onClose();
      } else {
        setErrorMessage(data.message || 'Failed to create event');
        setOverlayState('error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setErrorMessage('An unexpected error occurred');
      setOverlayState('error');
    }
  };
  
  const renderOverlayContent = () => {
    switch (overlayState) {
      case 'input':
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Create Event
              </h2>
              <p className="text-gray-600">
                {formatDateDisplay(selectedDate)}
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
                  Event Name
                </label>
                <input
                  type="text"
                  id="eventName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={eventDetails.eventName}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, eventName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={eventDetails.description}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                
                <TimeRangeSlider
                  startTime={eventDetails.startTime}
                  endTime={eventDetails.endTime}
                  onChange={handleTimeRangeChange}
                />
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </>
        );
        
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">Creating your event...</p>
          </div>
        );
        
      case 'error':
        return (
          <div className="text-center py-10">
            <p className="text-error mb-4">{errorMessage || 'Failed to create event.'}</p>
            <div className="flex justify-center space-x-3">
              <button
                className="btn btn-outline"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setOverlayState('input')}
              >
                Try Again
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const handleBackgroundClick = (e) => {
    e.stopPropagation();
    onClose();
  };
  
  const stopPropagation = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div
      className="fixed inset-0 bg-neutral bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
      onClick={handleBackgroundClick}
    >
      <div
        className="relative bg-white bg-opacity-90 p-6 rounded-xl shadow-2xl w-[600px] max-w-[90%]"
        onClick={stopPropagation}
      >
        <button
          className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost hover:bg-gray-100"
          onClick={onClose}
        >
          ✕
        </button>
        
        {renderOverlayContent()}
      </div>
    </div>
  );
};

export default EventCreationOverlay;