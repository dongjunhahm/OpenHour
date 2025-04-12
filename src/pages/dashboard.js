// External imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import dynamic from 'next/dynamic';

// For safety - ensure we're never using document on the server side
const isBrowser = typeof window !== 'undefined';

// Component imports
import Navbar from "../components/navbar";
import EventsList from "../components/eventsList";
import SharedCalendarsList from "../components/sharedCalendarsList";

// Dynamically import components that use browser APIs
const CalendarMenuOverlay = dynamic(
  () => import("../components/calendarMenuOverlay"),
  { ssr: false }
);

const Dashboard = () => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);
  const [showCalendarMenuOverlay, setShowCalendarMenuOverlay] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sharedCalendars, setSharedCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      if (!token) return;

      setLoading(true);
      try {
        // Fetch user events
        const eventsResponse = await axios.post(
          "/api/calendar/generate-events-list",
          {
            token: token,
          }
        );
        setEvents(eventsResponse.data);

        // Fetch user's shared calendars
        console.log("Fetching calendars with token:", token);
        try {
          const calendarsResponse = await axios.get(
            `/api/calendar/get-user-calendars?token=${token}`
          );
          if (calendarsResponse.data && calendarsResponse.data.calendars) {
            setSharedCalendars(calendarsResponse.data.calendars);
          } else {
            console.warn("No calendar data found in response");
            setSharedCalendars([]);
          }
        } catch (calendarError) {
          console.error("Error fetching shared calendars:", calendarError);
          console.error("Response data:", calendarError.response?.data);
          setSharedCalendars([]);
          // Don't fail the entire data fetch if just the calendars fail
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
            <button className="btn btn-success" onClick={handleOpenOverlay}>
              Create Shared Calendar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Your Shared Calendars
                </h2>
                <SharedCalendarsList calendars={sharedCalendars || []} />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Your Events</h2>
                <EventsList eventsFound={events || []} />
              </div>
            </div>
          )}

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
