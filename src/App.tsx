import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import LoginScreen from './components/LoginScreen'
import Dashboard, {type User} from "./components/Dashboard.tsx";
import RegisterScreen from "./components/RegisterScreen.tsx";
import SettingsScreen from "./components/SettingsScreen.tsx";
import { UserContext } from "./contexts/UserContext.ts";
import {useState} from "react";
import CreateChannel from "./components/CreateChannel.tsx";
import NotFound from "./components/NotFound.tsx";

function App() {
    const [user, setUser] = useState<User | null>(null);

    return (
        <UserContext.Provider value={{user, setUser}}>
            <Router>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="/create-channel" element={<CreateChannel />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </UserContext.Provider>
    )
}

export default App
