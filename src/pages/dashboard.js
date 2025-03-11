"use client";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import EventsList from "../components/eventsList";
import DatePicker from "../components/datePicker";

const Dashboard = () => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);
  const [dateRange, setDateRange] = useState("");
  const [events, setEvents] = useState([]);

  const handleDateChange = (event) => {
    const selectedRange = event.target.value;
    setDateRange(selectedRange);
  };

  const handleFetchEvents = async () => {
    const [startDate, endDate] = dateRange.split("/");

    try {
      const fetchedEvents = await axios.post("/api/read-events", {
        token: token,
        startDate: startDate,
        endDate: endDate,
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("error fetching events", error);
    }
  };

  useEffect(() => {
    console.log("Token in dashboard:", token);
    const fetchEvents = async () => {};
  }, [token]);

  const createSharedCalendar = async () => {
    const response = await axios.post("/api/store-events", {
      user_token: { token },
    });
    //placeholder, assuming that after the events are stored I'll have some kinda calendar ID to link?
    const calendarDetails = response.data;
    if (response.status === 200) {
      console.log("Response was successful and status code is 200.");
      console.log("Calendar ID looks like: " + calendarDetails);
    }

    const newApiResponse = await axios.post("/api/create-shared-calendar", {
      userToken: { token },
      calendarDetails,
    });
  };

  return (
    <div>
      <button className="btn btn-success" onClick={createSharedCalendar}>
        Create Shared Calendar
      </button>
      <button
        className="btn btn-ghost btn-neutral"
        onClick={console.log(token)}
      >
        check token
      </button>
      <div>
        <EventsList events={events}></EventsList>
      </div>
      <DatePicker></DatePicker>
    </div>
  );
};

export default Dashboard;
