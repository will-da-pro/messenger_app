import {useNavigate} from "react-router-dom";
import {type FormEvent, useContext, useEffect, useState} from "react";
import fetchUser from "../fetchUser.ts";
import NavBar from "./NavBar.tsx";
import {UserContext} from "../contexts/UserContext.ts";
import "../styles/SettingsScreen.css"
import axios, {AxiosError} from "axios";

interface ErrorData {
    username?: string[];
    email?: string[];
    first_name?: string[];
    last_name?: string[];
    general?: string;
}

interface PasswordErrorData {
    old_password?: string[];
    new_password?: string[];
    repeat_password?: string[];
    general?: string;
}

const SettingsScreen = () => {
    const navigate = useNavigate();

    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("No user context");
    }
    const {user, setUser} = userContext;

    const userId = localStorage.getItem("user_id");

    const [old_password, setOldPassword] = useState("");
    const [new_password, setNewPassword] = useState("");
    const [repeat_password, setRepeatPassword] = useState("");

    const [username, setUsername] = useState(user?.id);
    const [email, setEmail] = useState(user?.email);
    const [first_name, setFirstName] = useState(user?.first_name);
    const [last_name, setLastName] = useState(user?.last_name);

    const [error, setError] = useState<ErrorData>({});
    const [passwordError, setPasswordError] = useState<PasswordErrorData>({});

    useEffect(() => {
        fetchUser(() => {navigate("/login")}, userId, setUser).then(() => {
            console.log("User fetched");
        });
    }, [navigate, userId, setUser]);

    useEffect(() => {
        const updateForm = async () => {
            setUsername(user?.username);
            setEmail(user?.email);
            setFirstName(user?.first_name);
            setLastName(user?.last_name);
        }

        updateForm().then();
    }, [navigate, user]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        if (!token) {
            return;
        }

        try {
            const data = {
                username: username,
                email: email,
                first_name: first_name,
                last_name: last_name,
            }

            await axios.patch(`/api/users/${userId}/`, data, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            })

            window.location.reload();
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                setError({general: 'An unknown error occurred.'});
            }

            else if (error.status == 400) {
                const formError: ErrorData = error.response?.data;

                setError(formError);
            }

            else {
                setError({general: error.message});
            }
        }
    }

    const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        if (!token) {
            return;
        }

        try {
            const data = {
                old_password: old_password,
                new_password: new_password,
                repeat_password: repeat_password,
            }

            await axios.put(`/api/change-password/`, data, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            })

            window.location.reload();
        }

        catch (error: unknown) {
            if (!(error instanceof AxiosError)) {
                setPasswordError({general: 'An unknown error occurred.'});
            }

            else if (error.status == 400) {
                const formError: ErrorData = error.response?.data;

                setPasswordError(formError);
            }

            else {
                setPasswordError({general: error.message});
            }
        }
    }

    const deleteAccount = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate("/login");
        }

        try {
            await axios.delete(`/api/users/${userId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                }
            })

            navigate("/login");
        }

        catch (error: unknown) {
            console.error(error);
        }
    }

    if (!user) {
        return (
            <>
                <p>Loading...</p>
            </>
        );
    }

    return (
        <>
            <NavBar />
            <div className="settings-screen">
                <button onClick={() => {navigate("/")}}>Back home</button>

                <h1>Settings</h1>
                <h3>{user?.username}</h3>
                <h3>{user?.email}</h3>
                {(user?.first_name || user?.last_name) && <h3>{`${user?.first_name} ${user?.last_name}`}</h3>}

                <div className="divider" />

                <form className="settings-form" onSubmit={handlePasswordSubmit}>
                    <h2>Change Password</h2>
                    {passwordError.general && (<p className="error-message">{passwordError.general}</p>)}
                    <div>
                        <label htmlFor="old_password">Old Password: </label>
                        <input id="old_password"
                               type="password"
                               onChange={(e) => setOldPassword(e.target.value)}
                               value={old_password}
                               required
                        />
                    </div>
                    {passwordError.old_password?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <div>
                        <label htmlFor="new_password">New Password: </label>
                        <input id="new_password"
                               type="password"
                               onChange={(e) => setNewPassword(e.target.value)}
                               value={new_password}
                               required
                        />
                    </div>
                    {passwordError.new_password?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <div>
                        <label htmlFor="repeat_password">Repeat Password: </label>
                        <input id="repeat_password"
                               type="password"
                               onChange={(e) => setRepeatPassword(e.target.value)}
                               value={repeat_password}
                               required
                        />
                    </div>
                    {passwordError.repeat_password?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <button type="submit">Change Password</button>
                </form>

                <div className="divider" />

                <form className="settings-form" onSubmit={handleSubmit}>
                    <h2>Update Account Details</h2>
                    {error.general && (<p className="error-message">{error.general}</p>)}
                    <div>
                        <label htmlFor="username">Username: </label>
                        <input id="username"
                               type="text"
                               onChange={(e) => setUsername(e.target.value)}
                               value={username}
                               required
                        />
                    </div>
                    {error.username?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <div>
                        <label htmlFor="email">Email: </label>
                        <input id="email"
                               type="email"
                               onChange={(e) => setEmail(e.target.value)}
                               value={email}
                               required
                        />
                    </div>
                    {error.email?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <div>
                        <label htmlFor="first_name">First Name: </label>
                        <input id="first_name"
                               type="text"
                               onChange={(e) => setFirstName(e.target.value)}
                               value={first_name}
                        />
                    </div>
                    {error.first_name?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <div>
                        <label htmlFor="last_name">Last Name: </label>
                        <input id="last_name"
                               type="text"
                               onChange={(e) => setLastName(e.target.value)}
                               value={last_name}
                        />
                    </div>
                    {error.last_name?.map((item: string) => (
                        <p className="error-message">{item}</p>
                    ))}
                    <button type="submit">Update Account</button>
                </form>

                <div className="divider" />

                <button onClick={() => {
                    const userConfirmed = confirm("Are you sure you want to delete your account? (this cannot be undone)");

                    if (!userConfirmed) {
                        return;
                    }

                    deleteAccount().then();
                }}>Delete Account</button>
            </div>
        </>
    )
}

export default SettingsScreen
