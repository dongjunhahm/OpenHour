// pages/_app.js
import { Provider } from "react-redux";
import store from "../store/store"; // Import your store
import "../styles/globals.css";
import { useEffect } from 'react';

// Import auth debug utilities in development
const isDev = process.env.NODE_ENV === 'development';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Debug authentication and token handling
    if (isDev) {
      window.debugStore = store;
      window.debugAuth = {
        getState: () => store.getState(),
        getToken: () => store.getState().token?.token,
        logState: () => console.log('Current Redux State:', store.getState())
      };
      
      console.log('Debug tools initialized. Access with window.debugAuth');
    }
  }, []);

  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
