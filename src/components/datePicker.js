import "cally";
import next from "next";
import { max } from "pg/lib/defaults";
import { useState, useEffect, useRef } from "react";

const DatePicker = ({ onDateRangeChange = () => {}, initialValue = "" }) => {
  const [dateRange, setDateRange] = useState(initialValue);
  const calendarRef = useRef(null);

  useEffect(() => {
    setDateRange(initialValue);
  }, [initialValue]);

  useEffect(() => {
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
  }, [onDateRangeChange]);

  const currDate = new Date();
  const currYear = currDate.getFullYear();
  const nextYear = currYear + 1;
  const nextDate = currDate.setFullYear(nextYear);

  const minDate = currDate.toString();
  const maxDate = nextDate.toString();


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
          min={minDate}
          max={maxDate}
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

export default DatePicker;
