import {useContext, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import * as React from "react";
import ChannelList from "./ChannelList.tsx";
import ChannelView from "./ChannelView.tsx";
import NavBar from "./NavBar.tsx";
import "../styles/Dashboard.css"
import {UserContext} from "../contexts/UserContext.ts";
import {SelectedChannelContext} from "../contexts/SelectedChannelContext.ts";
import {ChannelsContext} from "../contexts/ChannelsContext.ts";
import fetchUser from "../fetchUser.ts";


export interface Channel {
    id: string;
    channel_name: string;
    channel_description: string;
    members: string[];
    owner: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
}

const Dashboard = () => {
    const [selected, setSelected] = useState<Channel | null>(null);
    const [channels, setChannels] = useState<Channel[] | null>(null);
    const navigate = useNavigate();

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("useUserContext must be used within a UserContext");
    }
    const {user, setUser} = userContext;

    const userId = localStorage.getItem("user_id");

    const [width, setWidth] = useState(200);
    const [cursor, setCursor] = useState<string>("ew-resize");
    const componentRef = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const sidebarMinWidth: number = 200;
    const sidebarMaxWidth: number = 400;

    useEffect(() => {
        fetchUser(() => {navigate("/login")}, userId, setUser).then(() => {
            console.log("User fetched");
        });
    }, [navigate, userId, setUser]);

    useEffect(() => {
        const updateCursor = async () => {
            if (width === sidebarMaxWidth) {
                setCursor("w-resize");
            }

            else if (width === sidebarMinWidth) {
                setCursor("e-resize");
            }

            else {
                setCursor("ew-resize");
            }
        }

        updateCursor().then();
    }, [width]);

    if (!user) return <div>Loading...</div>;

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log("MouseDown");
        e.preventDefault();
        startX.current = e.clientX;
        startWidth.current = width;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        const newWidth = startWidth.current + (e.clientX - startX.current);

        setWidth(Math.min(Math.max(sidebarMinWidth, newWidth), sidebarMaxWidth));
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <ChannelsContext.Provider value={{channels, setChannels}}>
            <SelectedChannelContext.Provider value={{selected, setSelected}}>
                <NavBar />
                <div id="main-container" className="wrapper">
                    <div className="left sidebar" ref={componentRef} style={{
                        width: `${width}px`
                    }}>
                        <ChannelList />
                        <div className="resize-handle" onMouseDown={handleMouseDown} style={{
                            cursor: cursor
                        }} />
                    </div>
                    <div className="right content">
                        <ChannelView />
                    </div>
                </div>
            </SelectedChannelContext.Provider>
        </ChannelsContext.Provider>
    )
}

export default Dashboard;
