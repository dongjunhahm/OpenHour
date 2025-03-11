"use client";
import { useRouter } from "next/router";
import Landing from "./landing";

const Home = () => {
  const router = useRouter();

  return (
    <div data-theme="light">
      <Landing></Landing>
    </div>
  );
};

export default Home;
