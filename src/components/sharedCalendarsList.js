import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import axios from 'axios';

const SharedCalendarsList = ({ calendars, onCalendarDeleted }) => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };
  
  const handleCalendarClick = (calendarId) => {
    router.push(`/shared-calendar/${calendarId}`);
  };
  
  const handleDeleteClick = async (e, calendarId) => {
    // Stop event propagation to prevent navigation
    e.stopPropagation();
    
    if (isDeleting) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this shared calendar? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setDeletingId(calendarId);
    
    try {
      // Call the delete API
      await axios.delete(`/api/calendar/delete-calendar?calendarId=${calendarId}&token=${token}`);
      
      // Notify parent component about the deletion
      if (onCalendarDeleted) {
        onCalendarDeleted(calendarId);
      } else {
        // If no callback is provided, reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting calendar:', error);
      alert('Failed to delete calendar. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h2 className="text-lg font-medium text-gray-900">Your Shared Calendars</h2>
      </div>
      
      {calendars.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {calendars.map((calendar) => (
            <li 
              key={calendar.id} 
              className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCalendarClick(calendar.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {calendar.title || `Shared Calendar ${String(calendar.id).substring(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateRange(calendar.start_date, calendar.end_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Minimum slot: {calendar.min_slot_duration ? Math.round(calendar.min_slot_duration / 60) + ' hours' : 'Not specified'}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                    {calendar.participant_count} participants
                  </span>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, calendar.id)}
                    className="text-red-500 hover:text-red-700 mr-2 focus:outline-none"
                    disabled={isDeleting}
                    aria-label="Delete calendar"
                  >
                    {isDeleting && deletingId === calendar.id ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Navigation arrow */}
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-6 text-center text-gray-500">
          <p>You haven't created any shared calendars yet.</p>
          <p className="mt-1 text-sm">Click "Create Shared Calendar" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default SharedCalendarsList;
