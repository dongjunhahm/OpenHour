import React from 'react';

const SharedCalendarView = ({ availableSlots }) => {
  // Group slots by day
  const slotsByDay = availableSlots.reduce((acc, slot) => {
    const date = new Date(slot.start);
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

  return (
    <div className="space-y-6">
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
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round(slot.duration)} min
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
