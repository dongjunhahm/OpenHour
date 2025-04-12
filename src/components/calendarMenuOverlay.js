"use client";

import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState } from "react";
import dynamic from 'next/dynamic';

// Dynamically import DatePicker with client-side only rendering
const DatePicker = dynamic(() => import("../components/datePicker"), { ssr: false });

const CalendarMenuOverlay = ({ onClose }) => {
  const router = useRouter();
  const [overlayState, setOverlayState] = useState("input");
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);
  const [formattedDateRange, setFormattedDateRange] = useState(
    "Select a date range."
  );
  const [minDuration, setMinDuration] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const options = [
    { value: "1:00", label: "1 Hour" },
    { value: "2:00", label: "2 Hours" },
    { value: "3:00", label: "3 Hours" },
    { value: "4:00", label: "4 Hours" },
    { value: "5:00", label: "5 Hours" },
  ];

  const handleCreateSharedCalendar = () => {
    console.log(
      "Button clicked with dateRange:",
      dateRange,
      "and minDuration:",
      minDuration
    );
    if (!dateRange || !minDuration) {
      console.error("need to select both date range and duration");
      return;
    }

    setOverlayState("loading");

    // Extract dates from range
    const [startDate, endDate] = dateRange.split("/");

    // Make the API request
    axios
      .post("/api/calendar/create-shared-calendar", {
        token,
        startDate,
        endDate,
        minDuration,
      })
      .then((response) => {
        console.log("Calendar created successfully:", response.data);
        router.push(`/shared-calendar/${response.data.calendarId}`);
      })
      .catch((error) => {
        console.error("failed to create shared calendar", error);
        setOverlayState("error");
      });
  };

  const renderOverlayContent = () => {
    switch (overlayState) {
      case "input":
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                GroupCal Creation
              </h2>
              <p className="text-gray-600">
                Choose your date range and create a shared calendar
              </p>
            </div>

            <div className="mb-6 text-center">
              <p className="text-xl font-semibold text-gray-700 mb-4">
                {formattedDateRange}
              </p>
              <DatePicker
                onDateRangeChange={handleDateRangeChange}
                initialValue={dateRange}
              />
              <SelectionBox
                options={options}
                onChange={handleSelectionChange}
              />
            </div>

            <div className="space-y-4">
              <button
                className="btn btn-success w-full"
                disabled={!isButtonEnabled}
                onClick={handleCreateSharedCalendar}
              >
                Create Shared Calendar
              </button>
            </div>
          </>
        );
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">Creating your shared calendar...</p>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <p className="text-error">Failed to create calendar.</p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => setOverlayState("input")}
            >
              Try Again!
            </button>
          </div>
        );
    }
  };

  const handleSelectionChange = (value) => {
    console.log("Selection changed to:", value);
    setMinDuration(value);
    updateButtonState(dateRange, value);
  };

  const handleDateRangeChange = (selectedRange) => {
    console.log("Date range changed to:", selectedRange);
    setDateRange(selectedRange);
    updateButtonState(selectedRange, minDuration);

    if (selectedRange) {
      const [startDate, endDate] = selectedRange.split("/");
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      };

      setFormattedDateRange(
        `${formatDate(startDate)} - ${formatDate(endDate)}`
      );
    } else {
      setFormattedDateRange("Select a date range.");
    }
  };

  const updateButtonState = (range, duration) => {
    console.log("Updating button state with:", range, duration);
    setIsButtonEnabled(!!range && !!duration);
  };

  const handleFetchEvents = async () => {
    if (!dateRange) {
      console.error("No date range selected");
      return;
    }

    const [startDate, endDate] = dateRange.split("/");

    try {
      const fetchedEvents = await axios.post("/api/read-events", {
        token: token,
        startDate: startDate,
        endDate: endDate,
      });
      setEvents(fetchedEvents.data);
      console.log("Fetched events", fetchedEvents.data);
    } catch (error) {
      console.error("Error fetching events", error);
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
        className="relative bg-white bg-opacity-90 p-6 rounded-xl shadow-2xl w-[500px] max-w-[90%]"
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

export default CalendarMenuOverlay;

function SelectionBox({ options, onChange }) {
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <select
      className="select select-ghost"
      value={selectedValue}
      onChange={handleChange}
    >
      <option value="" disabled>
        choose your duration
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
