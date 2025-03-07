"use client"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/dashboard";
import LoginPage from "../pages/loginPage";

const Home = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
};

export default Home;