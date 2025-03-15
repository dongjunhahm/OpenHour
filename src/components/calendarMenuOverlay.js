import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";
import EventsList from "../components/eventsList";
import DatePicker from "../components/datePicker";

const CalendarMenuOverlay = ({ onClose }) => {
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

  const readEvents = async () => {
    const response = await axios.post("/api/read-events", {
      user_token: { token },
    });

    console.log(response);
  };

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

  const handleBackgroundClick = (e) => {
    e.stopPropagation();
    onClose(); // This will trigger the close function if clicked anywhere on the background
  };

  const stopPropagation = (e) => {
    e.stopPropagation(); // Prevents click events inside the modal from propagating to the background
  };

  return (
    <div
      className="fixed inset-0 bg-neutral bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white bg-opacity-80 p-8 rounded-lg shadow-xl"
        onClick={stopPropagation}
      >
        <div className="">
          <h2 className="card-title">GroupCal Creation</h2>
          <p>Choose any week and your required time!</p>
        </div>
        <div>
          <div>
            <EventsList events={events}></EventsList>
          </div>
          <DatePicker onChange={handleDateChange}></DatePicker>
        </div>
        <div>
          <button onClick={readEvents}>jason son</button>
        </div>
        <button
          className="btn btn-outline btn-ghost opacity-80 btn-circle w-full transition-transform duration-200 hover:scale-95"
          onClick={onClose}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default CalendarMenuOverlay;
