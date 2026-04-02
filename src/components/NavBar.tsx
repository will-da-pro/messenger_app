import type {User} from "./Dashboard.tsx";
import {type NavigateFunction, useNavigate} from "react-router-dom";
import "../styles/NavBar.css"
import {UserContext} from "../contexts/UserContext.ts";
import {useContext} from "react";
import { IoSettingsOutline, IoLogOutSharp } from 'react-icons/io5';
import { FaHome } from 'react-icons/fa';
import Cookies from "js-cookie";

const NavBar = () => {
    const navigate: NavigateFunction = useNavigate();

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("No user context.");
    }
    const user: User | null = userContext.user;

    if (user === null) {
        return <p>No user</p>
    }

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_id');
        Cookies.remove('sessionid');
        Cookies.remove('csrftoken');
        navigate('/login');
    }

    return (
        <div id="nav-bar">
            <button className="nav-bar-component nav-bar-title" onClick={() => {navigate("/")}}>
                <h1>Messaging Service</h1>
                <FaHome className="nav-bar-icon" />
            </button>
            <div className="horizontal-divider" />
            <div className="nav-bar-component">
                <h1 className="nav-bar-username">{user.username}</h1>
            </div>
            <button className="nav-bar-component nav-bar-button" onClick={logout}>
                <h1>Log Out</h1>
                <IoLogOutSharp className="nav-bar-icon" title="Log Out" size={24} />
            </button>
            <button className="nav-bar-component nav-bar-button" onClick={() => {navigate("/settings")}}>
                <h1>Settings</h1>
                <IoSettingsOutline className="nav-bar-icon" title="Settings" size={24} />
            </button>
        </div>
    )
}

export default NavBar;