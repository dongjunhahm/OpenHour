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
  const [sharedCalendars, setSharedCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOpenOverlay = () => {
    setShowCalendarMenuOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowCalendarMenuOverlay(false);
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
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your shared calendars and events</p>
            <button className="btn btn-success mt-4" onClick={handleOpenOverlay}>
              Create Shared Calendar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Your Shared Calendars
                </h2>
                <SharedCalendarsList 
                  calendars={sharedCalendars || []} 
                  onCalendarDeleted={(deletedCalendarId) => {
                    // Filter out the deleted calendar from the state
                    setSharedCalendars(prevCalendars => 
                      prevCalendars.filter(calendar => calendar.id !== deletedCalendarId)
                    );
                  }}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Your Events</h2>
                <EventsList eventsFound={events || []} />
              </div>
            </div>
          )}

          {showCalendarMenuOverlay && (
            <CalendarMenuOverlay onClose={handleCloseOverlay} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
