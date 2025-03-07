import LoginButton from "./loginButton";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [userToken, setUserToken] = useState("");
  const [user, setUser] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(true);
  const router = useRouter();

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

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      setUser(null);
      setShowLoginButton(true);
    });
  };

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-5 w-5 stroke-current"
          >
            {" "}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>{" "}
          </svg>
        </button>
      </div>
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">OpenHour</a>
      </div>
      <div className="flex-none">
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
    </div>
  );
};

export default Navbar;
