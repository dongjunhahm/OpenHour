"use client";
import { useRouter } from "next/router";
import axios from "axios";
import { useSelector } from "react-redux";
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const router = useRouter();
  const token = useSelector((state) => state.token.token);

  useEffect(() => {
    console.log("Token in dashboard:", token);
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
      <button
        className="btn btn-ghost btn-neutral"
        onClick={createSharedCalendar}
      ></button>
      <button
        className="btn btn-ghost btn-neutral"
        onClick={console.log(token)}
      >
        check token
      </button>
    </div>
  );
};

export default Dashboard;
