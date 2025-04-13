import { googleSignIn } from "../pages/api/googleLogin";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setToken } from "../store/tokenSlice";

const LoginForm = () => {
  const router = useRouter();
  const { redirect_to } = router.query;
  const [userToken, setUserToken] = useState("");
  const [user, setUser] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

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

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        const { token } = result;
        dispatch(setToken(token));

        try {
          await axios.post("/api/user/update-token", {
            token,
            email: result.user.email,
            name: result.user.displayName,
          });
        } catch (tokenError) {
          console.error("error saving token to db,", tokenError);
        }

        // Redirect to the calendar page if a redirect is set, otherwise to dashboard
        if (redirect_to) {
          router.push(redirect_to);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error during Google Sign In:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card card-border bg-base-100 w-96 shadow-xl">
      <div className="ml-5 mt-5">
        <h2 className="card-title">Login</h2>
        <p>Enter your email below to login!</p>
      </div>

      <div className="ml-5">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Email</legend>
          <input
            type="text"
            className="input"
            placeholder="openhour@example.com"
          />
          <legend className="fieldset-legend">Password</legend>
          <input type="text" className="input" placeholder="Type here" />
        </fieldset>
      </div>
      <div className="card-body">
        <button className="btn btn-neutral">Log In</button>
      </div>
      <div className="card-body">
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="btn btn-outline btn-ghost"
        >
          {isLoading ? "Logging in..." : "Login With Google"}
        </button>

        <p>
          Don't have an account?
          <button className="mb-0.5 btn btn-ghost btn-link">Sign Up</button>
        </p>
      </div>
    </div>
  );
};
export default LoginForm;
