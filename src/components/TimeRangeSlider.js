import { useState, useEffect, useRef } from 'react';

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
  const [dragging, setDragging] = useState(null); // 'start', 'end', 'range', or null
  const sliderRef = useRef(null);
  
  // Update internal state when props change
  useEffect(() => {
    setStartValue(dateToMinutes(new Date(startTime)));
    setEndValue(dateToMinutes(new Date(endTime)));
  }, [startTime, endTime]);
  
  // Handle mouse move for drag functionality
  const handleMouseMove = (e) => {
    if (!dragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const minutes = Math.round(Math.max(0, Math.min(position * 1440, 1425)) / 15) * 15;
    
    if (dragging === 'start') {
      if (minutes < endValue - 15) {
        setStartValue(minutes);
        updateParent(minutes, endValue);
      }
    } else if (dragging === 'end') {
      if (minutes > startValue + 15) {
        setEndValue(minutes);
        updateParent(startValue, minutes);
      }
    } else if (dragging === 'range') {
      const rangeWidth = endValue - startValue;
      let newStart = minutes - (dragOffset || 0);
      
      // Ensure range stays within bounds
      if (newStart < 0) newStart = 0;
      if (newStart + rangeWidth > 1425) newStart = 1425 - rangeWidth;
      
      const newEnd = newStart + rangeWidth;
      setStartValue(newStart);
      setEndValue(newEnd);
      updateParent(newStart, newEnd);
    }
  };

  // Store drag offset for range dragging
  const [dragOffset, setDragOffset] = useState(0);
  
  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setDragging(null);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, startValue, endValue, dragOffset]);
  
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
  
  // Handle range slider dragging
  const handleRangeMouseDown = (e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width * 1440;
    setDragOffset(clickPosition - startValue);
    setDragging('range');
    e.preventDefault();
  };
  
  return (
    <div className="w-full mt-4">
      {/* Time display */}
      <div className="flex justify-between mb-2 text-sm font-medium">
        <div>{formatTimeString(startValue)}</div>
        <div>{formatTimeString(endValue)}</div>
      </div>
      
      {/* Integrated slider with visualizer */}
      <div 
        className="relative h-12 bg-gray-100 rounded-lg mt-4 cursor-pointer"
        ref={sliderRef}
      >
        {/* Selected range */}
        <div 
          className="absolute h-full bg-blue-500 rounded-lg cursor-move"
          style={{
            left: `${(startValue / 1440) * 100}%`,
            width: `${((endValue - startValue) / 1440) * 100}%`
          }}
          onMouseDown={handleRangeMouseDown}
        ></div>
        
        {/* Start handle */}
        <div 
          className="absolute top-0 h-full w-4 -ml-2 bg-blue-700 rounded-lg cursor-ew-resize flex items-center justify-center"
          style={{
            left: `${(startValue / 1440) * 100}%`
          }}
          onMouseDown={(e) => {
            setDragging('start');
            e.stopPropagation();
          }}
        >
          <div className="h-6 w-1 bg-white rounded-full"></div>
        </div>
        
        {/* End handle */}
        <div 
          className="absolute top-0 h-full w-4 -ml-2 bg-blue-700 rounded-lg cursor-ew-resize flex items-center justify-center"
          style={{
            left: `${(endValue / 1440) * 100}%`
          }}
          onMouseDown={(e) => {
            setDragging('end');
            e.stopPropagation();
          }}
        >
          <div className="h-6 w-1 bg-white rounded-full"></div>
        </div>
        
        {/* Time markers */}
        {[0, 6, 12, 18, 24].map((hour) => (
          <div 
            key={hour}
            className="absolute top-0 h-full border-l border-gray-300"
            style={{
              left: `${(hour * 60 / 1440) * 100}%`,
              display: hour === 0 || hour === 24 ? 'none' : 'block'
            }}
          ></div>
        ))}
      </div>
      
      {/* Time scale markers */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
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