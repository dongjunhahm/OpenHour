import { Provider } from "react-redux";
import store from "../store/store";
import { useRouter } from "next/router";
import Landing from "./landing";

const Home = () => {
  const router = useRouter();

  return (
    <Provider store={store}>
      <div data-theme="light">
        <Landing></Landing>
      </div>
    </Provider>
  );
};

export default Home;
