"use client";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";

const Landing = () => {
  return (
    <div>
      <Navbar></Navbar>
      <div className="grid grid-cols-2 mt-10">
        <div className="justify-items-center">
          <h1
            className="text-9xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Open
          </h1>
          <h1
            className="-mt-10 text-9xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Hour
          </h1>
        </div>
        <div>
          <h1
            className="text-6xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Free Time In A Single Click.
          </h1>
          <h1
            className="text-l uppercase font-medium tracking-tighter text-gray-950 mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Just connect your google calendar, and we'll do the rest!
          </h1>
        </div>

        <div className="text-9xl">random text here </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default Landing;
