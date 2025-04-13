"use client";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import Navbar from "../../components/navbar";
import SharedCalendarView from "../../components/sharedCalendarView";
import EventCreationOverlay from "../../components/EventCreationOverlay";

const SharedCalendarPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = useSelector((state) => state.token.token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [titleUpdateLoading, setTitleUpdateLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [activeUsers, setActiveUsers] = useState(1); // Start with just yourself
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const socketRef = useRef(null);
  const socketInitialized = useRef(false);

  // Initialize WebSocket connection
  useEffect(() => {
    // Function to initialize socket connection
    const initializeSocket = async () => {
      if (socketInitialized.current) return;

      // Make sure the socket.io server is running
      await fetch("/api/websocket");

      // Connect to WebSocket server
      const socket = io();
      socketRef.current = socket;
      socketInitialized.current = true;

      // Join specific calendar room
      socket.on("connect", () => {
        console.log("WebSocket connected");
        socket.emit("joinCalendar", id);

        // Don't automatically refresh on simple connection
        // We'll let the server decide when we need to refresh
      });

      // Listen for user count updates
      socket.on("userJoined", (data) => {
        console.log("User joined, active users:", data.count);
        setActiveUsers(data.count);

        // Automatically refresh available slots when a new user joins
        // Only refresh if the isNewUser flag is true (indicating this is a new join, not an invite)
        if (data.isNewUser) {
          console.log("New user joined, refreshing slots");
          refreshAvailableSlots(false, false); // Don't emit update and don't mark as new user
        }
      });

      socket.on("userLeft", (data) => {
        console.log("User left, active users:", data.count);
        setActiveUsers(data.count);
      });

      // Listen for calendar data updates
      socket.on("calendarUpdated", (data) => {
        console.log("Calendar updated notification received");
        // Update the calendar title if it matches current calendar
        if (data.calendarId === id) {
          setCalendarData((prevData) => ({
            ...prevData,
            title: data.title,
          }));
          setNewTitle(data.title);
        }
        setLastUpdated(new Date());
      });

      // Listen for slots updates
      socket.on("refreshSlots", () => {
        console.log("Refresh slots notification received");
        refreshAvailableSlots(false); // Don't emit another event to avoid loops
        setLastUpdated(new Date());
      });

      // Listen for participants updates
      socket.on("participantsUpdated", () => {
        console.log("Participants updated notification received");
        refreshParticipants();
        setLastUpdated(new Date());
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        // Try to reconnect
        setTimeout(() => {
          if (socket.disconnected) {
            console.log("Attempting to reconnect...");
            socket.connect();
          }
        }, 2000);
      });

      return socket;
    };

    // Initialize socket if we have a calendar ID
    if (id) {
      initializeSocket();
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection");
        socketRef.current.emit("leaveCalendar", id);
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  // Function to refresh participants list
  const refreshParticipants = async () => {
    let currentToken = token || localStorage.getItem("auth_token");
    if (!currentToken) return;

    try {
      const participantsResponse = await axios.get(
        `/api/calendar/get-participants?calendarId=${id}&token=${currentToken}`
      );
      setParticipants(participantsResponse.data.participants);
    } catch (err) {
      console.error("Error refreshing participants:", err);
    }
  };

  // Remove automatic periodic refresh and only refresh when needed
  // We no longer set up an interval here since we only want to refresh when a new user joins

  // Main data loading effect
  useEffect(() => {
    if (!id) return;

    // Get token from Redux or localStorage
    let currentToken = token;
    if (!currentToken) {
      // Fallback to localStorage if Redux token is not available
      currentToken = localStorage.getItem("auth_token");
      console.log("Using token from localStorage as fallback");

      // If still no token, redirect to login
      if (!currentToken) {
        console.log("No token found, redirecting to login");
        router.push(`/loginPage?redirect_to=/shared-calendar/${id}`);
        return;
      }
    }
    // commit comment

    // Log token info for debugging
    console.log("Shared Calendar - token info:", {
      tokenSource: token ? "Redux" : "localStorage",
      tokenPrefix: currentToken.substring(0, 6) + "...",
      tokenLength: currentToken.length,
    });

    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        console.log("Starting API requests with token");

        // Define a helper function to handle API calls with fallback to fetch
        const apiCall = async (url) => {
          try {
            if (typeof axios === "undefined") {
              console.log("Axios is not defined, using fetch instead");
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return { data: await response.json() };
            } else {
              return await axios.get(url);
            }
          } catch (error) {
            console.error(`Error calling ${url}:`, error);
            throw error;
          }
        };

        // Fetch calendar details
        console.log("Fetching calendar details...");
        const calendarResponse = await apiCall(
          `/api/calendar/get-calendar?id=${id}&token=${currentToken}`
        );
        setCalendarData(calendarResponse.data);
        setNewTitle(calendarResponse.data.title);
        console.log("Calendar data received");

        // Fetch participants
        console.log("Fetching participants...");
        const participantsResponse = await apiCall(
          `/api/calendar/get-participants?calendarId=${id}&token=${currentToken}`
        );
        setParticipants(participantsResponse.data.participants);
        console.log("Participants data received");

        // Fetch available slots
        console.log("Fetching available slots...");
        const slotsResponse = await apiCall(
          `/api/calendar/get-available-slots?calendarId=${id}&token=${currentToken}`
        );
        setAvailableSlots(slotsResponse.data.availableSlots);
        console.log("Slots data received");

        setLoading(false);
      } catch (err) {
        console.error("Error fetching calendar data:", err);
        setError("Failed to load calendar data. Please try logging in again.");
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [id, token]);

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setNewTitle(calendarData.title); // Reset to original title
  };

  const handleTitleSave = async () => {
    if (!newTitle.trim()) {
      return; // Don't save empty titles
    }

    // Get current token from Redux or localStorage
    let currentToken = token || localStorage.getItem("auth_token");
    if (!currentToken) {
      alert("Not authenticated. Please log in again.");
      router.push(`/loginPage?redirect_to=/shared-calendar/${id}`);
      return;
    }

    try {
      setTitleUpdateLoading(true);

      // Using axios or fetch to update the title
      if (typeof axios === "undefined") {
        const response = await fetch("/api/calendar/update-calendar", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calendarId: id,
            title: newTitle,
            token: currentToken,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Update calendar data with the new title
        setCalendarData({
          ...calendarData,
          title: data.calendar.title,
        });
      } else {
        const response = await axios.put("/api/calendar/update-calendar", {
          calendarId: id,
          title: newTitle,
          token: currentToken,
        });

        // Update calendar data with the new title
        setCalendarData({
          ...calendarData,
          title: response.data.calendar.title,
        });

        // Emit WebSocket event to notify other users
        if (socketRef.current) {
          socketRef.current.emit("calendarUpdated", {
            calendarId: id,
            title: response.data.calendar.title,
          });
        }
      }

      setIsEditingTitle(false);
    } catch (err) {
      console.error("Error updating calendar title:", err);
      alert("Failed to update calendar title");
    } finally {
      setTitleUpdateLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) return;

    // Get current token from Redux or localStorage
    let currentToken = token || localStorage.getItem("auth_token");
    if (!currentToken) {
      alert("Not authenticated. Please log in again.");
      router.push(`/loginPage?redirect_to=/shared-calendar/${id}`);
      return;
    }

    try {
      // Use fetch as a fallback if axios is not available
      if (typeof axios === "undefined") {
        const response = await fetch("/api/calendar/invite-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calendarId: id,
            invitedEmail: inviteEmail,
            inviterToken: currentToken,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        await axios.post("/api/calendar/invite-user", {
          calendarId: id,
          invitedEmail: inviteEmail,
          inviterToken: currentToken,
        });
      }

      setInviteEmail("");
      // Refresh participants list
      if (typeof axios === "undefined") {
        const response = await fetch(
          `/api/calendar/get-participants?calendarId=${id}&token=${currentToken}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setParticipants(data.participants);
      } else {
        const participantsResponse = await axios.get(
          `/api/calendar/get-participants?calendarId=${id}&token=${currentToken}`
        );
        setParticipants(participantsResponse.data.participants);
      }
    } catch (err) {
      console.error("Error inviting user:", err);
      alert("Failed to invite user");
    }
  };

  const refreshAvailableSlots = async (emitUpdate = true, isNewUser = true) => {
    // Get current token from Redux or localStorage
    let currentToken = token || localStorage.getItem("auth_token");
    if (!currentToken) {
      alert("Not authenticated. Please log in again.");
      router.push(`/loginPage?redirect_to=/shared-calendar/${id}`);
      return;
    }

    try {
      setLoading(true);
      console.log("Refreshing available slots...");

      // Recalculate available slots
      if (typeof axios === "undefined") {
        const response = await fetch("/api/calendar/find-available-slots", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calendarId: id,
            token: currentToken,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        await axios.post("/api/calendar/find-available-slots", {
          calendarId: id,
          token: currentToken,
        });
      }

      // Fetch updated available slots
      if (typeof axios === "undefined") {
        const response = await fetch(
          `/api/calendar/get-available-slots?calendarId=${id}&token=${currentToken}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableSlots(data.availableSlots);
      } else {
        const slotsResponse = await axios.get(
          `/api/calendar/get-available-slots?calendarId=${id}&token=${currentToken}`
        );
        setAvailableSlots(slotsResponse.data.availableSlots);
      }

      setLoading(false);
      setLastUpdated(new Date());
      console.log("Slots successfully refreshed");

      // Emit WebSocket event to notify other users, but only if we're the initiator
      // Now we include the isNewUser flag to control when refreshes happen
      if (emitUpdate && socketRef.current) {
        socketRef.current.emit("slotsUpdated", { 
          calendarId: id,
          isNewUser: isNewUser // Pass the flag indicating if this is a new user
        });
      }
    } catch (err) {
      console.error("Error refreshing slots:", err);
      setError("Failed to refresh available slots");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-xl">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            className="mt-4 btn btn-primary"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Calendar Not Found</p>
          <p>
            The shared calendar you're looking for does not exist or you don't
            have access to it.
          </p>
          <button
            className="mt-4 btn btn-primary"
            onClick={() => router.push("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Real-time status indicator */}
      <div className="bg-blue-100 p-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          <span className="text-sm">
            Live: {activeUsers} {activeUsers === 1 ? "user" : "users"} viewing
          </span>
        </div>
        <div className="text-xs text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {isEditingTitle ? (
            <div className="flex items-center mb-2">
              <input
                type="text"
                className="input input-bordered text-3xl font-bold text-gray-800 mr-2 py-1"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <button
                className="btn btn-sm btn-success mr-2"
                onClick={handleTitleSave}
                disabled={titleUpdateLoading}
              >
                {titleUpdateLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Save"
                )}
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={handleTitleCancel}
                disabled={titleUpdateLoading}
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-primary transition-colors"
              onClick={handleTitleEdit}
              title="Click to edit calendar title"
            >
              {calendarData.title}
              <span className="ml-2 text-sm text-gray-400"></span>
            </h1>
          )}
          <p className="text-gray-600">
            {new Date(calendarData.start_date).toLocaleDateString()} -{" "}
            {new Date(calendarData.end_date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Available Time Slots
              </h2>
              {availableSlots.length > 0 ? (
                <SharedCalendarView
                  availableSlots={availableSlots}
                  onDateClick={(date) => {
                    setSelectedDate(date);
                    setShowEventOverlay(true);
                  }}
                />
              ) : (
                <p className="text-gray-600">
                  No available time slots found for this period.
                </p>
              )}
              <button
                className="mt-4 btn btn-primary"
                onClick={() => refreshAvailableSlots(true)}
              >
                Refresh Available Slots
              </button>
            </div>
          </div>

          {/* Participants */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Participants</h2>
              <ul className="divide-y divide-gray-200">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                        {participant.name
                          ? participant.name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {participant.name || "Unnamed Participant"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {participant.email}
                        </p>
                      </div>
                    </div>
                    <div>
                      {participant.status === "pending" ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      ) : participant.status === "active" ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {participant.status || "Unknown"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invite Users */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Invite User</h2>
              <div className="flex items-center">
                <input
                  type="email"
                  className="input input-bordered flex-grow mr-2"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleInviteUser}>
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Creation Overlay */}
      {showEventOverlay && selectedDate && (
        <EventCreationOverlay
          onClose={() => setShowEventOverlay(false)}
          selectedDate={selectedDate}
          calendarId={id}
          onEventCreated={(eventData) => {
            console.log("Event created successfully:", eventData);
            // Show a success notification to the user
            alert("Event created successfully!");
            // Refresh available slots after creating an event
            refreshAvailableSlots();
          }}
        />
      )}
    </div>
  );
};

export default SharedCalendarPage;
