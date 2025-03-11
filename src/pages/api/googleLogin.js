import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../api/firebaseConfig";

export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/calendar");

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    const user = result.user;

    console.log("user info", user);
    return { user, credential, token };
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData.email;
    const credential = GoogleAuthProvider.credentialFromError(error);

    console.error("Error Code:", errorCode);
    console.error("Error Message:", errorMessage);
    console.error("Email:", email);
    console.error("Credential:", credential);
    return null;
  }
}
