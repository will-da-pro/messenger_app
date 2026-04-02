import {useContext, useEffect, useState} from "react";
import {type Channel} from "./Dashboard.tsx"
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "../styles/ChannelList.css"
import {ChannelsContext} from "../contexts/ChannelsContext.ts";
import {SelectedChannelContext} from "../contexts/SelectedChannelContext.ts";

const ChannelList = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const channelsContext = useContext(ChannelsContext);
    if (channelsContext === undefined) {
        throw new Error("No channels context");
    }
    const {channels, setChannels} = channelsContext;

    const selectedChannelContext = useContext(SelectedChannelContext);
    if (selectedChannelContext === undefined) {
        throw new Error("No selected channel context");
    }
    const {selected, setSelected} = selectedChannelContext;

    useEffect(() => {
        const fetchChannels = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get<Channel[]>('/api/channels/', {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                });
                setChannels(response.data);
                setError(null);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                }

                else {
                    setError("Unknown Error");
                }
            }
        };
        fetchChannels().then(() => {
            console.log("Servers found");
        });
    }, [navigate, setChannels]);

    if (error) return <div>{error}</div>;

    if (!channels) return <div>Loading...</div>;

    return (
        <div className="channel-list">
            {channels.map((item: Channel, index: number) => (
                <div className={`channel ${selected?.id === item.id && 'selected-channel'}`}
                     onClick={() => {setSelected(item)}} key={item.id}>
                    <h2 className="channel-name" key={index}>{item.channel_name}</h2>
                    <p className="channel-description">{item.channel_description}</p>
                </div>))
            }

            <div className="create-channel">
                <button className="create-channel-button" onClick={() => {navigate('/create-channel')}}>
                    Create New Channel
                </button>
            </div>
        </div>
    )
}

export default ChannelList;