import React from 'react';
import { useRouter } from 'next/router';

const SharedCalendarsList = ({ calendars }) => {
  const router = useRouter();

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };
  
  const handleCalendarClick = (calendarId) => {
    router.push(`/shared-calendar/${calendarId}`);
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
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {calendar.participant_count} participants
                  </span>
                  <svg className="h-5 w-5 text-gray-400 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
