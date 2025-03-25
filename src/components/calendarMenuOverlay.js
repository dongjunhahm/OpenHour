import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState } from "react";
import DatePicker from "../components/datePicker";

const CalendarMenuOverlay = ({ onClose }) => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);
  const [formattedDateRange, setFormattedDateRange] = useState(
    "Select a date range."
  );

  const handleDateRangeChange = (selectedRange) => {
    setDateRange(selectedRange);

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
            onChange={handleDateRangeChange}
            initialValue={dateRange}
          />
        </div>

        <div className="space-y-4">
          <button className="btn btn-success w-full">
            Create Shared Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarMenuOverlay;
