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
      
      {/* Minimal Content Section */}
      <section className="flex-grow flex flex-col items-center mt-20">
        <div className="container mx-auto px-4 py-16">
          {/* Time slots visualization - preserved from original */}
          <div className="max-w-md mx-auto mt-16 bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-gray-800">Available Times</h3>
              </div>
              
              {/* Time slots visualization - preserved */}
              <div className="space-y-3">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-gray-500">{`${7 + slot}:00 PM`}</div>
                    <div className={`h-10 rounded-lg flex-grow ${slot === 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-800 font-medium">Perfect Match Found!</div>
                  <div className="text-xs text-gray-600 mt-1">Thursday, 8:00 PM - Everyone is available</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step Items - preserved from original but styled in black & white */}
          <div className="max-w-md mx-auto mt-16">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">How It Works</h3>
            <div className="space-y-8">
              <StepItem 
                number="1"
                title="Connect Calendar" 
                description="Link your Google Calendar account securely with a single click."
              />
              <StepItem 
                number="2"
                title="Invite Team" 
                description="Share a link with participants to connect their calendars too."
              />
              <StepItem 
                number="3"
                title="Pick a Time" 
                description="Browse all available times and select what works best."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StepItem = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </div>
  </div>
);

export default Landing;