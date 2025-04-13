"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";
import "../styles/globals.css";

const Landing = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  // Animation for scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push("/loginPage");
  };

  const handleLearnMore = () => {
    const featureSection = document.getElementById("features");
    featureSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 space-y-6">
              <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
                  <span className="text-blue-600">Open</span>Hour
                </h1>
                <p className="text-xl md:text-2xl font-medium text-gray-700 mt-4">
                  Find free time in a single click.
                </p>
              </div>
              
              <p className="text-lg text-gray-600 max-w-md">
                Most tools find one time that works, and feel disconnected and clunky from your peers. 
                We show you all the times that do — instantly, allowing for easy collaboration.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={handleGetStarted}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
                >
                  Get Started
                </button>
                <button 
                  onClick={handleLearnMore}
                  className="btn bg-white hover:bg-gray-100 text-blue-600 font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg border border-blue-200 transition duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Hero Image/Animation */}
            <div className="md:w-1/2 mt-8 md:mt-0">
              <div className="relative">
                <div className="bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-2xl p-6 shadow-2xl">
                  <div className="bg-white rounded-xl shadow-inner p-4">
                    <div className="space-y-4">
                      {/* Calendar visualization */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-gray-800">Available Times</h3>
                        <span className="text-sm text-blue-600">Instantly Generated</span>
                      </div>
                      
                      {/* Time slots visualization */}
                      <div className="space-y-3">
                        {[1, 2, 3].map((slot) => (
                          <div key={slot} className="flex items-center gap-3">
                            <div className="w-16 text-sm text-gray-500">{`${7 + slot}:00 PM`}</div>
                            <div className={`h-10 rounded-lg flex-grow ${slot === 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-800 font-medium">Perfect Match Found!</div>
                          <div className="text-xs text-gray-600 mt-1">Thursday, 8:00 PM - Everyone is available</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 h-16 w-16 bg-yellow-400 rounded-full opacity-70 blur-sm"></div>
                <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-blue-400 rounded-full opacity-50 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose OpenHour?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="⚡️"
              title="Instant Sync"
              description="Connect your Google Calendar and instantly see everyone's availability without manual input."
            />
            <FeatureCard 
              icon="🔍"
              title="See All Options"
              description="Forget about back-and-forth. View all possible meeting times at once and choose what works best."
            />
            <FeatureCard 
              icon="🤝"
              title="Seamless Collaboration"
              description="Invite teammates with a simple link. No accounts required for participants to share availability."
            />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="md:w-1/3 space-y-12">
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
              
              <div className="md:w-2/3 mt-8 md:mt-0">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="text-xs text-gray-600 ml-2">openhour.app</div>
                  </div>
                  <div className="p-4">
                    <img 
                      src="/api/placeholder/600/400" 
                      alt="OpenHour App Interface" 
                      className="rounded-lg shadow w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to simplify scheduling?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Stop playing calendar tetris. Get everyone on the same page with just one click.
          </p>
          <button 
            onClick={handleGetStarted}
            className="btn bg-white text-blue-700 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
          >
            Get Started Now
          </button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition duration-300 border border-gray-100">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StepItem = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </div>
  </div>
);

export default Landing;