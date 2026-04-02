import {type FormEvent, useState} from 'react';
import axios, {AxiosError} from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/LoginScreen.css"

interface LoginData {
    data: {
        token: string,
        user_id: string,
    }
}

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response: LoginData = await axios.post('/api/login/', {
                username,
                password,
            });

            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user_id', response.data.user_id);
            navigate('/dashboard');
        } catch (err: unknown) {
            if (!(err instanceof AxiosError)) {
                setError('An unknown error occurred.');
            }

            else if (err.status == 401) {
                setError('Invalid username or password');
            }

            else {
                setError(err.message);
            }
        }
    };

    return (
        <div className="login-screen">
            <h1>Messaging Service</h1>
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            <button onClick={() => navigate('/register')}>Don't have an account? Register</button>
        </div>
    );
}

export default LoginScreen;
