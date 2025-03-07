"use client"
import { useRouter } from "next/router";

const Home = () => {
    const router = useRouter();

    return (
       <button onClick={() => router.push('/loginPage')} >Click Me!</button>
    );
};

export default Home;