"use client";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import axios from "axios";

const CalendarInvitePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = useSelector((state) => state.token.token);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return; // Wait for the router to be ready

    if (token) {
      // User is already logged in, call the join-calendar API first, then redirect
      const joinCalendar = async () => {
        try {
          // Call the join-calendar API to update participant status
          await axios.post("/api/calendar/join-calendar", {
            inviteCode: id, // Using the ID as the invite code
            token,
          });

          console.log("Successfully joined the calendar");
          // After joining, redirect to the shared calendar view
          router.push(`/shared-calendar/${id}`);
        } catch (error) {
          console.error("Error joining calendar:", error);
          // Still redirect to the shared calendar, they might already be a member
          router.push(`/shared-calendar/${id}`);
        }
      };

      joinCalendar();
    } else {
      // User is not logged in, redirect to login page with redirection info
      router.push(`/loginPage?redirect_to=/shared-calendar/${id}`);
    }
  }, [id, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-xl">Preparing your calendar access...</p>
      </div>
    </div>
  );
};

export default CalendarInvitePage;
