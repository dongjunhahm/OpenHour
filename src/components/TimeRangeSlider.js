import { useState, useEffect } from 'react';

// Convert date to minutes since midnight
const dateToMinutes = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

// Format minutes to time string (e.g., 9:30 AM)
const formatTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

const TimeRangeSlider = ({ startTime, endTime, onChange }) => {
  // Convert props to minutes for easier calculations
  const initialStartMinutes = dateToMinutes(new Date(startTime));
  const initialEndMinutes = dateToMinutes(new Date(endTime));
  
  // State for slider values
  const [startValue, setStartValue] = useState(initialStartMinutes);
  const [endValue, setEndValue] = useState(initialEndMinutes);
  
  // Update internal state when props change
  useEffect(() => {
    setStartValue(dateToMinutes(new Date(startTime)));
    setEndValue(dateToMinutes(new Date(endTime)));
  }, [startTime, endTime]);
  
  // Handle start time change
  const handleStartChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    // Ensure start time doesn't exceed end time - 15 minutes
    if (newValue < endValue - 15) {
      setStartValue(newValue);
      updateParent(newValue, endValue);
    }
  };
  
  // Handle end time change
  const handleEndChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    // Ensure end time is after start time + 15 minutes
    if (newValue > startValue + 15) {
      setEndValue(newValue);
      updateParent(startValue, newValue);
    }
  };
  
  // Update parent component with new values
  const updateParent = (start, end) => {
    if (onChange) {
      const newStartTime = new Date(startTime);
      newStartTime.setHours(Math.floor(start / 60), start % 60, 0);
      
      const newEndTime = new Date(endTime);
      newEndTime.setHours(Math.floor(end / 60), end % 60, 0);
      
      onChange({
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
  };
  
  return (
    <div className="w-full mt-4">
      {/* Time display */}
      <div className="flex justify-between mb-2 text-sm font-medium">
        <div>{formatTimeString(startValue)}</div>
        <div>{formatTimeString(endValue)}</div>
      </div>
      
      {/* Sliders */}
      <div className="space-y-6">
        {/* Start time slider */}
        <div>
          <label htmlFor="start-time" className="block text-xs text-gray-500 mb-1">
            Start Time
          </label>
          <input
            id="start-time"
            type="range"
            min="0"
            max="1410" // 23:30 in minutes
            step="15" // 15-minute intervals
            value={startValue}
            onChange={handleStartChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* End time slider */}
        <div>
          <label htmlFor="end-time" className="block text-xs text-gray-500 mb-1">
            End Time
          </label>
          <input
            id="end-time"
            type="range"
            min="15" // At least 15 minutes after midnight
            max="1425" // 23:45 in minutes
            step="15" // 15-minute intervals
            value={endValue}
            onChange={handleEndChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
      
      {/* Visual representation of selected time range */}
      <div className="relative h-4 bg-gray-100 rounded-full mt-4">
        <div 
          className="absolute h-full bg-blue-500 rounded-full" 
          style={{
            left: `${(startValue / 1440) * 100}%`,
            width: `${((endValue - startValue) / 1440) * 100}%`
          }}
        ></div>
      </div>
      
      {/* Time scale markers */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11:59 PM</span>
      </div>
    </div>
  );
};

export default TimeRangeSlider;