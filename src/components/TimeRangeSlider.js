import { useState, useEffect, useRef } from 'react';

// Convert date string to minutes since midnight
const dateToMinutes = (dateString) => {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
};

// Convert minutes since midnight to formatted time string (6:00 AM, 8:30 PM)
const minutesToTimeString = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

export default function TimeRangeSlider({ startTime, endTime, onChange }) {
  // Calculate min and max time in minutes
  const minTime = dateToMinutes(startTime);
  const maxTime = dateToMinutes(endTime);
  
  // State for the current selected range
  const [rangeValues, setRangeValues] = useState({
    start: minTime,
    end: maxTime
  });
  
  // Refs for dragging functionality
  const sliderRef = useRef(null);
  const isDraggingStart = useRef(false);
  const isDraggingEnd = useRef(false);
  
  // Update range if props change
  useEffect(() => {
    setRangeValues({
      start: dateToMinutes(startTime),
      end: dateToMinutes(endTime)
    });
  }, [startTime, endTime]);
  
  // Calculate percentages for positioning
  const startPercent = ((rangeValues.start - minTime) / (maxTime - minTime)) * 100;
  const endPercent = ((rangeValues.end - minTime) / (maxTime - minTime)) * 100;
  
  // Handle mouse/touch events for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sliderRef.current || (!isDraggingStart.current && !isDraggingEnd.current)) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      // Handle both mouse and touch events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const minutePosition = Math.round(minTime + position * (maxTime - minTime));
      
      // Ensure value is within bounds
      const boundedValue = Math.max(minTime, Math.min(maxTime, minutePosition));
      
      if (isDraggingStart.current) {
        if (boundedValue < rangeValues.end - 15) { // 15 min minimum gap
          setRangeValues(prev => ({ ...prev, start: boundedValue }));
          notifyChange(boundedValue, rangeValues.end);
        }
      } else if (isDraggingEnd.current) {
        if (boundedValue > rangeValues.start + 15) { // 15 min minimum gap
          setRangeValues(prev => ({ ...prev, end: boundedValue }));
          notifyChange(rangeValues.start, boundedValue);
        }
      }
    };
    
    const handleMouseUp = () => {
      isDraggingStart.current = false;
      isDraggingEnd.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: true });
    document.addEventListener('touchend', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [minTime, maxTime, rangeValues]);
  
  // Notify parent of changes
  const notifyChange = (start, end) => {
    if (onChange) {
      const newStartDate = new Date(startTime);
      newStartDate.setHours(Math.floor(start / 60));
      newStartDate.setMinutes(start % 60);
      
      const newEndDate = new Date(endTime);
      newEndDate.setHours(Math.floor(end / 60));
      newEndDate.setMinutes(end % 60);
      
      onChange({
        startTime: newStartDate,
        endTime: newEndDate
      });
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto mt-8 px-4">
      {/* Time Display */}
      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium text-blue-600">
          {minutesToTimeString(rangeValues.start)}
        </div>
        <div className="text-sm font-medium text-blue-600">
          {minutesToTimeString(rangeValues.end)}
        </div>
      </div>
      
      {/* Slider Track */}
      <div 
        ref={sliderRef}
        className="relative w-full h-2 bg-gray-200 rounded-full mt-6 mb-8 cursor-pointer"
      >
        {/* Selected Range */}
        <div 
          className="absolute h-full bg-blue-500 rounded-full" 
          style={{ 
            left: `${startPercent}%`, 
            right: `${100 - endPercent}%` 
          }}
        ></div>
        
        {/* Start Handle */}
        <div
          className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow focus:outline-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${startPercent}%`, top: '50%', zIndex: 10, cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); isDraggingStart.current = true; }}
          onTouchStart={(e) => { e.preventDefault(); isDraggingStart.current = true; }}
          role="slider"
          aria-label="Set start time"
          aria-valuetext={minutesToTimeString(rangeValues.start)}
        ></div>
        
        {/* End Handle */}
        <div
          className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow focus:outline-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${endPercent}%`, top: '50%', zIndex: 10, cursor: 'grab' }}
          onMouseDown={(e) => { e.preventDefault(); isDraggingEnd.current = true; }}
          onTouchStart={(e) => { e.preventDefault(); isDraggingEnd.current = true; }}
          role="slider"
          aria-label="Set end time"
          aria-valuetext={minutesToTimeString(rangeValues.end)}
        ></div>
      </div>
      
      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{minutesToTimeString(minTime)}</span>
        <span>{minutesToTimeString(maxTime)}</span>
      </div>
    </div>
  );
}