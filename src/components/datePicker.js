import "cally";
import { useState, useEffect } from "react";

const DatePicker = ({ onDateRangeChange, initialValue = "" }) => {
  const [dateRange, setDateRange] = useState(initialValue);

  useEffect(() => {
    //if initial value in parent component changes, local is updated
    setDateRange(initialValue);
  }, [initialValue]);

  const handleDateChange = (event) => {
    const selectedRange = event.target.value; // formatted in yyyy-mm-dd/yyyy-mm-dd
    setDateRange(selectedRange);

    //notify parent component about local change
    if (onDateRangeChange) {
      onDateRangeChange(selectedRange);
    }
  };

  return (
    <div>
      <button
        popoverTarget="cally-popover1"
        className="input input-border"
        id="cally1"
        style={{ positionAnchor: "--cally1" }} // Corrected the style prop
      >
        {dateRange ? dateRange : "Pick a date range!"}
      </button>
      <div
        popover
        id="cally-popover1"
        className="dropdown bg-base-100 rounded-box shadow-lg"
        style={{ positionAnchor: "--cally1" }}
      >
        <calendar-range
          class="cally"
          value={dateRange}
          min="2024-01-01"
          max="2024-12-31"
          locale="en-GB"
          onchange={handleDateChange} // Update the date range on change
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

export default DatePicker;
