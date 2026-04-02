import {type FormEvent, useState} from 'react';
import axios, {AxiosError} from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterScreen.css';

interface ErrorData {
    email?: string[];
    username?: string[];
    password?: string[];
    first_name?: string[];
    last_name?: string[];
    repeat_password?: string;
    general?: string;
}

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [repeat_password, setRepeatPassword] = useState('');
    const [error, setError] = useState<ErrorData>({});
    const [complete, setComplete] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== repeat_password) {
            setError({repeat_password: "Passwords do not match"});
            return;
        }

        try {
            await axios.post('/api/register/', {
                email,
                username,
                password,
                first_name,
                last_name,
            });

            setComplete(true);
        } catch (err: unknown) {
            if (!(err instanceof AxiosError)) {
                setError({general: 'An unknown error occurred.'});
            }

            else if (err.status == 400) {
                const formError: ErrorData = err.response?.data;

                setError(formError);
            }

            else {
                setError({general: err.message});
            }
        }
    };

    return (
        <div className="login-screen">
            <h1>Messaging Service</h1>
            <h2>Register</h2>
            {error.general && (<p className="error-message">{error.general}</p>)}
            <form onSubmit={handleSubmit}>
                <div>
                    <label><span className="required-symbol">*</span> Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                {error.username?.map((item: string) => (
                    <p className="error-message">{item}</p>
                ))}
                <div>
                    <label><span className="required-symbol">*</span> Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {error.email?.map((item: string) => (
                    <p className="error-message">{item}</p>
                ))}
                <div>
                    <label>First Name:</label>
                    <input
                        type="text"
                        value={first_name}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                {error.first_name?.map((item: string) => (
                    <p className="error-message">{item}</p>
                ))}
                <div>
                    <label>Last Name:</label>
                    <input
                        type="text"
                        value={last_name}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                {error.last_name?.map((item: string) => (
                    <p className="error-message">{item}</p>
                ))}
                <div>
                    <label><span className="required-symbol">*</span> Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error.password?.map((item: string) => (
                    <p className="error-message">{item}</p>
                ))}
                <div>
                    <label><span className="required-symbol">*</span> Repeat Password:</label>
                    <input
                        type="password"
                        value={repeat_password}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        required
                    />
                </div>
                {error.repeat_password && (<p className="error-message">{error.repeat_password}</p>)}
                <p><span className="required-symbol">*</span> Required</p>
                <button type="submit">Register</button>
            </form>
            <button onClick={() => navigate('/login')}>Already have an account? Log in</button>

            { complete && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h1>Registration Successful!</h1>
                        <button onClick={() => navigate('/login')}>Log in</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginScreen;
