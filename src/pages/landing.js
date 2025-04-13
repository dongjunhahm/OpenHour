"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";
import "../styles/globals.css";

const Landing = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section with Title and Tagline side by side */}
      <section className="flex justify-center items-center mt-20 mb-16">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div>
            <h1
              className="text-9xl md:text-[12rem] font-bold uppercase tracking-tighter text-gray-950"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Open
            </h1>
            <h1
              className="-mt-10 md:-mt-14 text-9xl md:text-[12rem] font-bold uppercase tracking-tighter text-gray-950"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Hour
            </h1>
          </div>
          <div className="md:ml-8 max-w-md">
            <h2
              className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Free Time In A Single Click.
            </h2>
            <p
              className="text-l uppercase font-medium tracking-tighter text-gray-950"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Just connect your google calendar, and we'll do the rest!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section with Two Columns */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:space-x-12 items-start justify-center">
          {/* How It Works - Left Column */}
          <div className="w-full md:w-5/12 mb-12 md:mb-0">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              How It Works
            </h3>
            <div className="space-y-8">
              <StepItem
                number="1"
                title="Connect Calendar"
                description="Link your Google Calendar account securely with a single click."
                color="bg-blue-500"
              />
              <StepItem
                number="2"
                title="Invite Team"
                description="Share a link with participants to connect their calendars too."
                color="bg-green-500"
              />
              <StepItem
                number="3"
                title="Pick a Time"
                description="Browse all available times and select what works best."
                color="bg-purple-500"
              />
            </div>
          </div>

          {/* Available Times - Right Column with Browser Mockup */}
          <div className="w-full md:w-5/12">
            <div className="browser-mockup border border-gray-200 rounded-t-lg bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="flex-grow mx-2">
                  <div className="h-6 bg-white rounded-md w-full flex items-center justify-center">
                    <span className="text-xs text-gray-500">openhour.app</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-b-xl p-6 shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Available Times
                  </h3>
                </div>

                {/* Time slots visualization with colors */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-sm text-gray-500">8:00 PM</div>
                    <div className="h-10 rounded-lg flex-grow bg-blue-200"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-sm text-gray-500">9:00 PM</div>
                    <div className="h-10 rounded-lg flex-grow bg-blue-500"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-sm text-gray-500">10:00 PM</div>
                    <div className="h-10 rounded-lg flex-grow bg-blue-300"></div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-800 font-medium">
                      Perfect Match Found!
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Thursday, 9:00 PM - Everyone is available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 mt-auto text-center text-gray-500 text-sm">
        Made by Students For Students!
      </footer>
    </div>
  );
};

const StepItem = ({ number, title, description, color }) => (
  <div className="flex items-start gap-4">
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full ${color} text-white flex items-center justify-center font-bold`}
    >
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </div>
  </div>
);

export default Landing;
