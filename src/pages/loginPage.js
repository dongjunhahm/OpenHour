"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import "../styles/globals.css";
import LoginButton from "../app/components/loginButton";

const LoginPage = () => {
  const [userToken, setUserToken] = useState("");
  const [user, setUser] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setShowLoginButton(false);
      } else {
        setUser(null);
        setShowLoginButton(true);
      }
    });
  }, []);



  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      setUser(null);
      setShowLoginButton(true);
    })
  }

  return (
    <div>
      {user && (
        <button
          onClick={handleLogout}
          className="btn btn-ghost text-gray-700 transition-transform duration-200 hover:scale-95"
        >
          Logout
        </button>
      )}
      {showLoginButton && <LoginButton setUserToken={setUserToken} />}
    </div>
  );
};

export default LoginPage;