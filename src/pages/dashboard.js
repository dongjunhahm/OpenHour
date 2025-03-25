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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = axios.post("/api/generate-events-list", {
          token: token,
        });
        console.log("user events list", response);
        setEvents(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchEvents();
  }, [token]); //dependency array includes token, so on token change itll refresh

  return (
    <div>
      <EventsList eventsFound={events} />
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
