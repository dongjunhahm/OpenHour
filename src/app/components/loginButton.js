import React, { useState } from "react";
import { googleSignIn } from "../../pages/api/googleLogin";

const LoginButton = ({ setUserToken }) => {
    const [isLoading, setIsLoading] = useState(false);
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
    };

    return (
        <div>
            <button
                onClick = {handleLogin}
                disabled={isLoading}
                className="btn btn-outline btn-ghost btn-circle"
            >
                {isLoading ? "Logging in..." : "Click me!"}
            </button>
        </div>
    );
};

export default LoginButton;