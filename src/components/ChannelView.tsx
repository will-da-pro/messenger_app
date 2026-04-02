import {type FormEvent, useEffect, useState, useRef, useContext} from "react";
import type {User} from "./Dashboard.tsx";
import axios, {AxiosError} from "axios";
import {useNavigate} from "react-router-dom";
import ChannelInfoPopup from "./ChannelInfoPopup.tsx";
import "../styles/ChannelView.css"
import {SelectedChannelContext} from "../contexts/SelectedChannelContext.ts";
import { FaTimes , FaEllipsisH } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';

interface Message {
    id: string;
    author: string;
    channel: string;
    content: string;
    created_at: string;
    reply_to: string;
}

const ChannelView = () => {
    const navigate = useNavigate();

    const [ws, setWs] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const [reply_to , setReplyTo] = useState<Message | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [showPopup, setShowPopup] = useState<boolean>(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const selectedChannelContext = useContext(SelectedChannelContext);
    if (selectedChannelContext === undefined) {
        throw new Error("No selected channel context");
    }
    const selected = selectedChannelContext.selected;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const togglePopup = () => {
        setShowPopup(!showPopup);
    }

    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            if (!selected) {
                return;
            }
            try {
                const response = await axios.get<Message[]>('/api/messages/', {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                    params: {
                        channel: selected.id,
                    },
                });

                setMessages(response.data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                }

                else {
                    setError("Unknown Error");
                }
            }
        }

        fetchMessages().then(() => {
            console.log("Fetched messages");
        });
    }, [selected, navigate]);

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            if (!selected) {
                return;
            }
            try {
                const response = await axios.get<User[]>('/api/users/', {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                    params: {
                        channels: selected.id,
                    },
                });

                setUsers(response.data);
                setError(null);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                }

                else {
                    setError("Unknown Error");
                }
            }
        }

        fetchUsers().then(() => {
            console.log("Fetched users");
        });
    }, [selected, navigate]);

    const getUser = async (user_id: string): Promise<User | null> => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
        }

        try {
            const response = await axios.get<User>(`/api/users/${user_id}`, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            })

            return response?.data;
        }

        catch (err: unknown) {
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    return null;
                }

                else {
                    setError(err.message);
                }
            }

            else if (err instanceof Error) {
                setError(err.message);
            }

            else {
                setError("Unknown Error");
            }

            return null;
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            return;
        }

        if (!selected) {
            return;
        }

        let channelWs: WebSocket | null = null;

        const createWebsocket = async () => {
            if (!selected) {
                return;
            }

            channelWs = new WebSocket(`/ws/channels/${selected.id}/?token=${token}`);

            channelWs.onopen = () => {
                console.log("WebSocket Connected!");
            }

            channelWs.onmessage = (event: MessageEvent) => {
                const message: Message = JSON.parse(event.data);
                setMessages((prev => prev.concat(message)));
            }

            channelWs.onclose = () => {
                console.log("WebSocket Closed!");
            }

            channelWs.onerror = (error) => {
                console.error("WebSocket Error:", error);
            }

            setWs(channelWs);
        }

        createWebsocket().then(() => {
            console.log("WebSocket Created!");
        });

        return () => {
            channelWs?.close();
            setWs(null);
        }
    }, [selected, setWs]);

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    const sendMessage = async (message: string, reply_to: string | null = null) => {
        const message_data = {
            "content": message,
            "reply_to": reply_to,
        };

        ws?.send(JSON.stringify(message_data));
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await sendMessage(content, reply_to?.id);
        setContent("");
        setReplyTo(null);
    }

    const getName = (id: string)=> {
        if (users == null) {
            return id;
        }

        const user = users.find(obj => obj.id == id);

        if (user !== undefined) {
            return user.username;
        }

        getUser(id).then((newUser) => {
            if (!newUser) {
                return id;
            }

            setUsers([...users, newUser]);

            return newUser.username;
        });
    }

    if (error) {
        return (
            <div className="messages">
                <p>{error}</p>
            </div>
        )
    }

    if (!selected) {
        return (
            <div className="messages">
                <h1>No channel selected!</h1>
                <p>Select a channel or create one in the left sidebar.</p>
            </div>
        )
    }

    if (!users) {
        return (
            <div className="messages">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="channel-view">
            <div className="channel-view-header">
                <h3 className="channel-header-name">{selected.channel_name}</h3>
                <FaEllipsisH className="channel-info-button" onClick={() => {togglePopup()}} />
            </div>
            <div className="messages">
                {messages?.map((item: Message, index: number) => (
                    <>
                        {index > 0 && Date.parse(messages[index - 1].created_at) < Date.parse(item.created_at) - 120000 && <div className="message-divider" />}
                        <div className="message-item" key={item.id} onClick={() => {
                            setReplyTo(item);
                            scrollToBottom();
                        }}>
                            {item.reply_to && <p className="reply-to">{`╭─── Replying to: ${users.find(obj => obj.id === messages.find(obj => obj.id === item.reply_to)?.author)?.username} • ${messages.find(obj => obj.id === item.reply_to)?.content}`}</p>}
                            {(index === 0 ||
                                messages[index - 1].author !== item.author ||
                                Date.parse(messages[index - 1].created_at) < Date.parse(item.created_at) - 120000) &&
                                <h2 className="author" key={index}>{`${getName(item.author)} • ${new Date(item.created_at).toLocaleString()}`}</h2>}
                            <p className="contents">{item.content}</p>
                        </div>
                    </>))
                }
                <div ref={messagesEndRef} />
            </div>
            <div className="channel-view-footer">
                {reply_to && <div className="reply-to-selection">
                    <p className="reply-to">{`Replying to: ${users.find(obj => obj.id === reply_to.author)?.username} • ${reply_to.content}`}</p>
                    <FaTimes className="cancel-reply" onClick={() => {setReplyTo(null)}} />
                </div>}
                <form className="message-form" onSubmit={handleSubmit}>
                    <div>
                        <input
                            id="content"
                            type="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter message"
                            required
                        />
                    </div>
                    <button type="submit" className="send-message-button"><MdSend /></button>
                </form>
            </div>
            {showPopup && <ChannelInfoPopup channel={selected} users={users} setUsers={setUsers} onClose={togglePopup} />}
        </div>
    )
}

export default ChannelView;
