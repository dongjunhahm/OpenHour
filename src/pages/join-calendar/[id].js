"use client";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";

const CalendarInvitePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = useSelector((state) => state.token.token);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return; // Wait for the router to be ready

    if (token) {
      // User is already logged in, redirect them directly to the shared calendar
      router.push(`/shared-calendar/${id}`);
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
