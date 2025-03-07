"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import LoginButton from "../components/loginButton";
import Navbar from "../components/navbar";
import { Footer } from "../components/footer";
import "../styles/globals.css";

const LoginPage = () => {
  return (
    <div>
      <Navbar></Navbar>
      <div className="grid grid-cols-2 mt-10">
        <h1
          className="text-8xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          OpenHour
        </h1>
        <h1
          className="text-6xl font-bold uppercase tracking-tighter text-gray-950 mb-4"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Finding Free Time in One Easy Step
        </h1>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default LoginPage;
