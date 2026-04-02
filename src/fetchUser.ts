import axios from "axios";
import type {User} from "./components/Dashboard.tsx";
import type {Dispatch, SetStateAction} from "react";

const fetchUser = async (onError: () => void, userId: string | null, setUser: Dispatch<SetStateAction<User | null>>) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        onError();
        return;
    }
    try {
        const response = await axios.get<User>(`/api/users/${userId}/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        setUser(response.data);
    } catch {
        onError();
    }
};

export default fetchUser;