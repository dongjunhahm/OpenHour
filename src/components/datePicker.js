"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';

// Import cally only on client-side
const DatePicker = ({ onDateRangeChange = () => {}, initialValue = "" }) => {
  const [dateRange, setDateRange] = useState(initialValue);
  const calendarRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This will only run on client-side
    setIsClient(true);
    // Import cally library dynamically only on client-side
    import("cally");
  }, []);

  useEffect(() => {
    setDateRange(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!isClient) return;
    
    const calendar = calendarRef.current;
    if (calendar) {
      const handleCalendarChange = (event) => {
        const selectedRange = event.target.value;
        setDateRange(selectedRange);
        onDateRangeChange(selectedRange);
      };

      calendar.addEventListener("change", handleCalendarChange);
      return () => calendar.removeEventListener("change", handleCalendarChange);
    }
  }, [onDateRangeChange, isClient]);

  if (!isClient) {
    return <div className="input input-border">Loading date picker...</div>;
  }

  return (
    <div>
      <button
        data-popover-target="cally-popover1"
        className="input input-border"
        id="cally1"
      >
        {dateRange ? dateRange : "Pick a date range!"}
      </button>
      <div
        popoverTarget="cally-popover1"
        className="dropdown bg-base-100 rounded-box shadow-lg"
        id="cally1"
      >
        <calendar-range
          class="cally"
          ref={calendarRef}
          value={dateRange}
          min="2024-01-01"
          max="2024-12-31"
          locale="en-GB"
        >
          <svg
            aria-label="Previous"
            className="fill-current size-4"
            slot="previous"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M15.75 19.5 8.25 12l7.5-7.5"></path>
          </svg>
          <svg
            aria-label="Next"
            className="fill-current size-4"
            slot="next"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
          </svg>
          <calendar-month></calendar-month>
        </calendar-range>
      </div>
    </div>
  );
};

// Use dynamic import with ssr: false to prevent server-side rendering of this component
export default dynamic(() => Promise.resolve(DatePicker), { ssr: false });
