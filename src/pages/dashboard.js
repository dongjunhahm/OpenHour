"use client";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import EventsList from "../components/eventsList";
import DatePicker from "../components/datePicker";
import CalendarMenuOverlay from "../components/calendarMenuOverlay";
import Navbar from "../components/navbar";

const Dashboard = () => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);
  const [showCalendarMenuOverlay, setShowCalendarMenuOverlay] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenOverlay = () => {
    setShowCalendarMenuOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowCalendarMenuOverlay(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.post("/api/generate-events-list", {
          token: token,
        });
        console.log("Full axios response:", response);
        console.log("Response data:", response.data);

        setEvents(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (token) {
      fetchEvents();
    }
  }, [token]);

  return (
    <div>
      <Navbar></Navbar>
      <div className="flex">
        {/* Sidebar */}
        <div></div>
        <div
          className={`
        w-80 bg-base-200 min-h-screen p-4 
        transform transition-transform duration-300 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        fixed top-0 left-0 z-50 lg:relative lg:translate-x-0
      `}
        >
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-4 right-4"
          >
            ✕
          </button>
          <ul className="menu text-base-content">
            <li>
              <a>Sidebar Item 1</a>
            </li>
            <li>
              <a>Sidebar Item 2</a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-4">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="btn btn-primary lg:hidden mb-4"
          >
            Open Sidebar
          </button>
          <button className="btn btn-success mb-4" onClick={handleOpenOverlay}>
            Create Shared Calendar
          </button>
          <EventsList eventsFound={events || []} />

          {showCalendarMenuOverlay && (
            <CalendarMenuOverlay onClose={handleCloseOverlay} />
          )}
        </div>

        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
