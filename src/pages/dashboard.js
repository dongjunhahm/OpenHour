"use client";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import EventsList from "../components/eventsList";
import DatePicker from "../components/datePicker";
import CalendarMenuOverlay from "../components/calendarMenuOverlay";

const Dashboard = () => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);
  const [showCalendarMenuOverlay, setShowCalendarMenuOverlay] = useState(false);

  const handleOpenOverlay = () => {
    setShowCalendarMenuOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowCalendarMenuOverlay(false);
  };

  return (
    <div>
      <button className="btn btn-success" onClick={handleOpenOverlay}>
        Create Shared Calendar
      </button>
      {showCalendarMenuOverlay && (
        <CalendarMenuOverlay onClose={handleCloseOverlay}></CalendarMenuOverlay>
      )}
    </div>
  );
};

export default Dashboard;
