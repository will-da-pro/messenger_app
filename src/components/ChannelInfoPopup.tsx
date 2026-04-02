import type {Channel, User} from "./Dashboard.tsx";
import React, {type Dispatch, type FormEvent, type SetStateAction, useContext, useState} from "react";
import "../styles/ChannelInfoPopup.css"
import {UserContext} from "../contexts/UserContext";
import axios, {AxiosError} from "axios";
import {useNavigate} from "react-router-dom";

interface ChannelInfoPopupProps {
    channel: Channel;
    users: User[];
    setUsers: Dispatch<SetStateAction<User[]>>;
    onClose: () => void;
}

interface EditChannelErrorData {
    channel_name?: string[];
    channel_description?: string[];
    owner?: string[];
    members?: string[];
    general?: string;
}

const ChannelInfoPopup = (props: ChannelInfoPopupProps) => {
    const navigate = useNavigate();

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("No user context.");
    }
    const user: User | null = userContext.user;

    const isOwner: boolean = props.channel.owner === user?.id;

    const childClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    }

    const [newUserName, setNewUserName] = useState<string>("");
    const [newUserError, setNewUserError] = useState<string>("");
    const [channel_name, setChannelName] = useState<string>(props.channel.channel_name);
    const [channel_description, setChannelDescription] = useState<string>(props.channel.channel_description);
    const [editChannelError, setEditChannelError] = useState<EditChannelErrorData>({});

    const getUser = async (username: string): Promise<User | null> => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            return null;
        }

        try {
            const newUsers = await axios.get<User[]>(`/api/users/`, {
                headers: {
                    Authorization: `Token ${token}`
                },
                params: {
                    username,
                },
            });

            if (newUsers.data.length === 0) return null;

            return newUsers.data[0];
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                throw error;
            }

            setNewUserError(error.message);

            return null;
        }
    }

    const handleAddUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newUser: User | null = await getUser(newUserName);

        if (!newUser) {
            setNewUserError("User not found!");
            return;
        }

        // Map the user id instead of just checking equality of the entire object in case the user changes their profile
        if (props.users.map(obj => obj.id).includes(newUser.id)) {
            setNewUserError("User already in channel!");
            return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/login");
        }

        try {
            setNewUserError("");
            const usersCopy = [...props.users];
            usersCopy.push(newUser);

            const members = usersCopy.map(obj => obj.id);

            const data = {
                members
            }

            await axios.patch(`/api/channels/${props.channel.id}/`, data, {
                headers: {
                    Authorization: `Token ${token}`
                }
            });

            props.setUsers(usersCopy);
            setNewUserName("");
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                setNewUserError("An unknown error occurred.");
                return;
            }

            setNewUserError(error.message);
        }
    }

    const removeUser = async (user: User) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/login");
        }

        try {
            setNewUserError("");
            const usersCopy = [...props.users].filter(obj => obj.id !== user.id);
            const members = usersCopy.map(obj => obj.id);

            const data = {
                members
            }

            console.log(data)

            await axios.patch(`/api/channels/${props.channel.id}/`, data, {
                headers: {
                    Authorization: `Token ${token}`
                }
            })

            props.setUsers(usersCopy);
        }

        catch (error: unknown) {
            console.error(error);
        }
    }

    const leaveChannel = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/login");
        }

        try {
            const data = {
                channel: props.channel.id,
            }

            await axios.post(`/api/leave-channel/`, data, {
                headers: {
                    Authorization: `Token ${token}`
                }
            });

            window.location.reload();
        }

        catch (error: unknown) {
            console.error(error);
        }
    }

    // Send request to edit channel
    const editChannel = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        if (!token) {
            return;
        }

        try {
            const data = {
                channel_name,
                channel_description,
            }

            await axios.patch(`/api/channels/${props.channel.id}/`, data, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            });

            window.location.reload();
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                setEditChannelError({general: 'An unknown error occurred.'});
            }

            else if (error.status == 400) {
                setEditChannelError(error.response?.data);
            }

            else {
                setEditChannelError({general: error.message});
            }
        }
    }

    const deleteChannel = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/login");
        }

        try {
            await axios.delete(`/api/channels/${props.channel.id}/`, {
                headers: {
                    Authorization: `Token ${token}`
                }
            })
        }

        catch (error: unknown) {
            console.error(error);
        }
    }

    return (
        <div className="popup-overlay" onClick={props.onClose}>
            <div className="popup-content channel-info-popup" onClick={childClick}>
                <h1>{props.channel.channel_name}</h1>

                <div className="divider" />

                <pre>{props.channel.channel_description}</pre>

                <div className="divider" />

                <h2>Members</h2>
                <div className="member-list">
                    {props.users.map((user: User) => (
                        <div className="user-info">
                            <div className="user-profile">
                                <h3>{user.username}</h3>
                                <p>{user.email}</p>
                            </div>
                            {isOwner && user.id !== props.channel.owner &&
                                <button onClick={() => {
                                    const userConfirmed = confirm("Are you sure you want to remove this user?");

                                    if (!userConfirmed) {
                                        return;
                                    }

                                    removeUser(user).then()
                                }}>Remove User</button>}
                        </div>
                    ))}
                </div>

                <div className="divider" />

                {/* Only visible if the user is not the channel owner */}
                {!isOwner &&
                    <button onClick={() => {leaveChannel().then()}}>Leave Channel</button>
                }

                {/* Only visible if the user is the channel owner */}
                {isOwner &&
                    <div className="owner-settings">
                        <h1>Owner Settings</h1>
                        <h2>Add Users</h2>
                        {newUserError && (<p className="error-message">{newUserError}</p>)}
                        <form onSubmit={handleAddUser}>
                            <label htmlFor="username">Username: </label>
                            <input
                                id="username"
                                type="text"
                                onChange={(e) => setNewUserName(e.target.value)}
                                value={newUserName}
                                required
                            />
                            <button type="submit">Add User</button>
                        </form>

                        <h2>Edit Channel Info</h2>
                        <form onSubmit={editChannel}>
                            {editChannelError.general && (<p className="error-message">{editChannelError.general}</p>)}
                            <label htmlFor="channel_name">Channel Name: </label>
                            <input
                                id="channel_name"
                                type="text"
                                onChange={(e) => setChannelName(e.target.value)}
                                value={channel_name}
                                required
                            />
                            {editChannelError.channel_name?.map((item: string) => (
                                <p className="error-message">{item}</p>
                            ))}

                            <label htmlFor="channel_description">Channel Description: </label>
                            <textarea
                                id="channel_description"
                                onChange={(e) => setChannelDescription(e.target.value)}
                                value={channel_description}
                                required
                            />
                            {editChannelError.channel_description?.map((item: string) => (
                                <p className="error-message">{item}</p>
                            ))}

                            {editChannelError.owner?.map((item: string) => (
                                <p className="error-message">{item}</p>
                            ))}

                            {editChannelError.members?.map((item: string) => (
                                <p className="error-message">{item}</p>
                            ))}

                            <button type="submit">Save Changes</button>
                        </form>

                        <div className="divider" />

                        <button onClick={() => {
                            const userConfirmed = confirm("Are you sure you want to delete this channel? (cannot be undone)");

                            if (!userConfirmed) {
                                return;
                            }

                            deleteChannel().then(() => {
                                window.location.reload();
                            })
                        }}>Delete Channel</button>
                    </div>
                }
            </div>
        </div>
    )
}

export default ChannelInfoPopup;
