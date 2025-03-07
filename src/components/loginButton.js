import React, { useState } from "react";
import { googleSignIn } from "../pages/api/googleLogin";
import { useRouter } from "next/router";

const LoginButton = ({ setUserToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        const { token } = result;
        console.log(token);
        setUserToken(token);
      }
    } catch (error) {
      console.error("Error during Google Sign In:", error);
    } finally {
      setIsLoading(false);
    }
    router.push("/dashboard");
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="btn btn-outline btn-ghost"
      >
        {isLoading ? "Logging in..." : "Sign In"}
      </button>
    </div>
  );
};

export default LoginButton;
