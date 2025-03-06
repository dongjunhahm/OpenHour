"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import "../styles/globals.css";

const Home = () => {

  return (
    <div>
      <button>Hi world</button>
    </div>
  );
};

export default Home;