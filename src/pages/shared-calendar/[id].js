"use client";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../components/navbar";
import SharedCalendarView from "../../components/sharedCalendarView";

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

  useEffect(() => {
    if (!id || !token) return;
    
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        
        // Fetch calendar details
        const calendarResponse = await axios.get(`/api/calendar/get-calendar?id=${id}&token=${token}`);
        setCalendarData(calendarResponse.data);
        
        // Fetch participants
        const participantsResponse = await axios.get(`/api/calendar/get-participants?calendarId=${id}&token=${token}`);
        setParticipants(participantsResponse.data.participants);
        
        // Fetch available slots
        const slotsResponse = await axios.get(`/api/calendar/get-available-slots?calendarId=${id}&token=${token}`);
        setAvailableSlots(slotsResponse.data.availableSlots);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching calendar data:", err);
        setError("Failed to load calendar data");
        setLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [id, token]);

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    try {
      await axios.post("/api/calendar/invite-user", {
        calendarId: id,
        invitedEmail: inviteEmail,
        inviterToken: token
      });
      
      setInviteEmail("");
      // Refresh participants list
      const participantsResponse = await axios.get(`/api/calendar/get-participants?calendarId=${id}&token=${token}`);
      setParticipants(participantsResponse.data.participants);
    } catch (err) {
      console.error("Error inviting user:", err);
      alert("Failed to invite user");
    }
  };

  const refreshAvailableSlots = async () => {
    try {
      setLoading(true);
      
      // Recalculate available slots
      await axios.post("/api/calendar/find-available-slots", {
        calendarId: id,
        token
      });
      
      // Fetch updated available slots
      const slotsResponse = await axios.get(`/api/calendar/get-available-slots?calendarId=${id}&token=${token}`);
      setAvailableSlots(slotsResponse.data.availableSlots);
      
      setLoading(false);
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
            onClick={() => router.push('/dashboard')}
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
          <p>The shared calendar you're looking for does not exist or you don't have access to it.</p>
          <button 
            className="mt-4 btn btn-primary"
            onClick={() => router.push('/dashboard')}
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shared Calendar</h1>
          <p className="text-gray-600">
            {new Date(calendarData.start_date).toLocaleDateString()} - {new Date(calendarData.end_date).toLocaleDateString()}
          </p>
          <p className="text-gray-600">Minimum slot duration: {calendarData.min_slot_duration} hours</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Available Time Slots</h2>
              {availableSlots.length > 0 ? (
                <SharedCalendarView availableSlots={availableSlots} />
              ) : (
                <p className="text-gray-600">No available time slots found for this period.</p>
              )}
              <button
                className="mt-4 btn btn-primary"
                onClick={refreshAvailableSlots}
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
                  <li key={participant.id} className="py-3 flex items-center">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                      {participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-medium">{participant.name || 'Unnamed Participant'}</p>
                      <p className="text-sm text-gray-500">{participant.email}</p>
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
                <button 
                  className="btn btn-primary"
                  onClick={handleInviteUser}
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedCalendarPage;
