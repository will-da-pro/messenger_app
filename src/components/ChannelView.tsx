import {type FormEvent, useEffect, useState, useRef, useContext, useCallback} from "react";
import type {User} from "./Dashboard.tsx";
import axios, {AxiosError} from "axios";
import {useNavigate} from "react-router-dom";
import ChannelInfoPopup from "./ChannelInfoPopup.tsx";
import "../styles/ChannelView.css"
import {SelectedChannelContext} from "../contexts/SelectedChannelContext.ts";
import {FaTimes, FaEllipsisH} from 'react-icons/fa';
import {MdSend} from 'react-icons/md';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import {UserContext} from "../contexts/UserContext.ts";

interface MessageRequest {
    count: number;
    next: string | null;
    previous: string | null;
    results: Message[];
}

interface Message {
    id: string;
    author: string;
    channel: string;
    content: string;
    created_at: string;
    reply_to: string;
    edited: boolean;
}

interface WebsocketUpdate {
    type: string;
    id?: string;
    message?: Message;
}

const ChannelView = () => {
    const navigate = useNavigate();

    const [ws, setWs] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const [reply_to, setReplyTo] = useState<Message | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [moreMessages, setMoreMessages] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const pageMessageCount: number = 50;

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const scrollContainerRef = useRef<null | HTMLDivElement>(null);

    const selectedChannelContext = useContext(SelectedChannelContext);
    if (selectedChannelContext === undefined) {
        throw new Error("No selected channel context");
    }
    const selected = selectedChannelContext.selected;

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("No user context.");
    }
    const user: User | null = userContext.user;

    const scrollToBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            console.log("scrolling to bottom")
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, []);

    const updateMessages = async (newMessages: Message[]) => {
        const map = new Map<string, Message>(messages.map(item => [item.id, item]));

        newMessages.forEach(msg => {map.set(msg.id, msg)})

        const combined: Message[] = Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Preserve scroll position when prepending older messages
        const container = scrollContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        let atBottom = false;

        if (messagesEndRef.current && scrollContainerRef.current) {
            const containerRect = scrollContainerRef.current.getBoundingClientRect();
            const bottomRect = messagesEndRef.current.getBoundingClientRect();

            // If the top of the sentinel is at or above the bottom of the container
            atBottom = bottomRect.top <= containerRect.bottom;
        }

        setMessages(combined);

        requestAnimationFrame(() => {
            if (container) {
                if (atBottom) {
                    container.scrollTop = container.scrollHeight;
                }

                else {
                    container.scrollTop = container.scrollHeight - previousScrollHeight;
                }
            }
        });
    }

    useEffect(() => {
        const scrollDown = async () => {
            if (messages.length > 0 && isInitialLoad) {
                scrollToBottom();
                setIsInitialLoad(false);
            }
        }

        scrollDown().then();
    }, [messages.length, isInitialLoad, scrollToBottom]);

    const togglePopup = () => {
        setShowPopup(!showPopup);
    }

    // Initial message fetch

    useEffect(() => {
        const fetchMessages = async () => {
            setIsInitialLoad(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            if (!selected) {
                return;
            }
            try {
                const response = await axios.get<MessageRequest>('/api/messages/', {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                    params: {
                        channel: selected.id,
                    },
                });
                setMessages(response.data.results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
                setMoreMessages(response.data.next !== null);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Unknown Error");
                }
            }
        }

        fetchMessages().then(() => {
            console.log("Fetched messages");
        });
    }, [selected, navigate]);

    // Fetch users in channel

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
                } else {
                    setError("Unknown Error");
                }
            }
        }

        fetchUsers().then(() => {
            console.log("Fetched users");
        });
    }, [selected, navigate]);

    // Get user by ID

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
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                if (err.status === 404) {
                    return null;
                } else {
                    setError(err.message);
                }
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unknown Error");
            }

            return null;
        }
    }

    // Websocket

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
                const update: WebsocketUpdate = JSON.parse(event.data);
                console.log(update)

                if (update.type === "message") {
                    const message = update.message;
                    if (message) {
                        setMessages((prev => prev.concat(message)));
                        scrollToBottom();
                    }
                }

                if (update.type === "edit") {
                    const message = update.message;
                    if (message) {
                        setMessages((prev => prev.with(prev.findIndex((msg) => msg.id === message.id), message)));
                        scrollToBottom();
                    }
                }

                if (update.type === "delete") {
                    const messageID = update.id;
                    if (messageID) {
                        setMessages((prev => prev.filter(message => message.id !== messageID)));
                    }
                }
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
    }, [scrollToBottom, selected, setWs]);

    const sendMessage = async (message: string, reply_to: string | null = null) => {
        const message_data = {
            "type": "message",
            "message": {
                "content": message,
                "reply_to": reply_to,
            }
        };

        ws?.send(JSON.stringify(message_data));
    }

    const sendEdit = async (message_id: string, content:  string) => {
        const message_data = {
            "type": "edit",
            "message": {
                "id": message_id,
                "content": content,
            }
        }

        ws?.send(JSON.stringify(message_data));
    }

    const sendDelete = async (message_id: string) => {
        const message_data = {
            "type": "delete",
            "id": message_id,
        }

        ws?.send(JSON.stringify(message_data));
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (editingMessage) {
            await sendEdit(editingMessage.id, content);
            setEditingMessage(null);
        }

        else {
            scrollToBottom();
            await sendMessage(content, reply_to?.id);
        }

        setContent("");
        setReplyTo(null);
    }

    const getName = (id: string) => {
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

    const loadMore = async () => {
        console.log("Fetching new messages");
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        if (!selected) {
            return;
        }
        // Don't try to load more messages if none exist on the server
        if (!moreMessages) {
            return;
        }
        // Stops it from trying to load more messages the moment a user clicks on a channel
        if (isInitialLoad) {
            return;
        }
        try {
            const page = Math.floor(messages.length / pageMessageCount) + 1;
            const response = await axios.get<MessageRequest>('/api/messages/', {
                headers: {
                    Authorization: `Token ${token}`,
                },
                params: {
                    channel: selected.id,
                    page: page,
                },
            });

            await updateMessages(response.data.results);

            setMoreMessages(response.data.next !== null);
            console.log("fetched new messages");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unknown Error");
            }
        }
    }

    const [ sentryRef ] = useInfiniteScroll({
        loading: false,
        hasNextPage: moreMessages,
        onLoadMore: loadMore,
        rootMargin: '0px 0px 400px 0px',
    });

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
                <FaEllipsisH className="channel-info-button" onClick={() => {
                    togglePopup()
                }}/>
            </div>
                <div className="messages" ref={scrollContainerRef}>
                    {moreMessages && <div ref={sentryRef} style={{ height: '20px' }} />}
                    {messages?.map((item: Message, index: number) => (
                        <div key={item.id}>
                            {(index === 0 ||
                                messages[index - 1].author !== item.author ||
                                index > 0 && Date.parse(messages[index - 1].created_at) < Date.parse(item.created_at) - 120000) &&
                                <div className="message-divider"/>}

                            <div className="message-item">
                                <div className="message-toolbar">
                                    <div className="message-toolbar-button" onClick={() => {
                                        setEditingMessage(null);
                                        setReplyTo(item);
                                        scrollToBottom();
                                    }}>
                                        <p>Reply</p>
                                    </div>

                                    { item.author === user?.id &&
                                        <>
                                            <div className="message-toolbar-button" onClick={() => {
                                                setReplyTo(null);
                                                setEditingMessage(item);
                                                setContent(item.content);
                                            }}>
                                                <p>Edit</p>
                                            </div>
                                            <div className="message-toolbar-button" onClick={() => {
                                                sendDelete(item.id).then();
                                            }}>
                                                <p>Delete</p>
                                            </div>
                                        </>
                                    }
                                </div>

                                {item.reply_to && <p className="reply-to">
                                    <svg className="reply-line" width="20" height="14" viewBox="0 0 20 14" fill="none"
                                         stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                        <path d="M20 1.5 H7.5 A6 6 0 0 0 1.5 7.5 V14"/>
                                    </svg>
                                    {` ${users.find(obj => obj.id === messages.find(obj => obj.id === item.reply_to)?.author)?.username} `}
                                    <span
                                        className="reply-text">{messages.find(obj => obj.id === item.reply_to)?.content}</span>
                                </p>}
                                {(index === 0 ||
                                        messages[index - 1].author !== item.author ||
                                        Date.parse(messages[index - 1].created_at) < Date.parse(item.created_at) - 120000) &&
                                    <h2 className="author">{getName(item.author)} <span
                                        className="message-timestamp">{new Date(item.created_at).toLocaleString()}</span>
                                    </h2>
                                }

                                <p className="contents">{item.content}</p>

                                {item.edited && <p className="edited-message">(edited)</p>}
                            </div>
                        </div>))
                    }
                    <div ref={messagesEndRef}/>
                </div>
            <div className="channel-view-footer">
                {reply_to && <div className="reply-to-selection">
                    <p className="reply-to">
                        {`Replying to: ${users.find(obj => obj.id === reply_to.author)?.username} `}
                        <span className="reply-text">{reply_to.content}</span>
                    </p>
                    <FaTimes className="cancel-reply" onClick={() => {
                        setReplyTo(null);
                    }}/>
                </div>}
                {editingMessage && <div className="editing-selection">
                    <p className="editing">
                        {`Editing: ${users.find(obj => obj.id === editingMessage.author)?.username} `}
                        <span className="editing-text">{editingMessage.content}</span>
                    </p>
                    <FaTimes className="cancel-edit" onClick={() => {
                        setEditingMessage(null);
                    }}/>
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
                    <button type="submit" className="send-message-button"><MdSend/></button>
                </form>
            </div>
            {showPopup &&
                <ChannelInfoPopup channel={selected} users={users} setUsers={setUsers} onClose={togglePopup}/>}
        </div>
    )
}

export default ChannelView;
