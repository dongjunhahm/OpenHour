"use client";
import { useRouter } from "next/router";
import LoginPage from "./loginPage";

const Home = () => {
  const router = useRouter();

  return (
    <div data-theme="light">
      <LoginPage></LoginPage>
    </div>
  );
};

export default Home;
