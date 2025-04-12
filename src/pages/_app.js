// pages/_app.js
import { Provider } from "react-redux";
import store from "../store/store"; // Import your store
import "../styles/globals.css"; // Import global CSS

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
