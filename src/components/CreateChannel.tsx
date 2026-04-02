import NavBar from "./NavBar.tsx";
import {type FormEvent, useContext, useEffect, useState} from "react";
import fetchUser from "../fetchUser.ts";
import {useNavigate} from "react-router-dom";
import {UserContext} from "../contexts/UserContext.ts";
import "../styles/CreateChannel.css"
import axios, {AxiosError} from "axios";

interface ErrorData {
    channel_name?: string[];
    channel_description?: string[];
    owner?: string[];
    members?: string[];
    general?: string;
}

const CreateChannel = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<ErrorData>({});

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    const setUser = userContext.setUser;

    const userId = localStorage.getItem("user_id");

    useEffect(() => {
        fetchUser(() => {navigate("/login")}, userId, setUser).then(() => {
            console.log("User fetched");
        });
    }, [navigate, userId, setUser]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        if (!token) {
            return;
        }

        try {
            const data = {
                channel_name: name,
                channel_description: description,
                owner: userId,
                members: [userId]
            }

            await axios.post(`/api/channels/`, data, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            });

            navigate("/");
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                setError({general: 'An unknown error occurred.'});
            }

            else if (error.status == 400) {
                setError(error.response?.data);
            }

            else {
                setError({general: error.message});
            }
        }
    }

    return (
        <>
            <NavBar />
            <div className="create-channel-screen">
                <h1>Create Channel</h1>

                <form onSubmit={handleSubmit}>
                    {error.general && (<p className="error-message">{error.general}</p>)}
                    <label htmlFor="channel_name">Channel Name: </label>
                    <input
                        id="channel_name"
                        type="text"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        required
                    />
                    {error.channel_name?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}

                    <label htmlFor="channel_description">Channel Description: </label>
                    <textarea
                        id="channel_description"
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        required
                    />
                    {error.channel_description?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}

                    {error.owner?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}

                    {error.members?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}

                    <button type="submit">Create Channel</button>
                </form>
            </div>
        </>
    )
}

export default CreateChannel;