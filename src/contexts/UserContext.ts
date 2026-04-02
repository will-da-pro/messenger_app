import {createContext, type Dispatch, type SetStateAction} from "react";
import {type User} from "../components/Dashboard.tsx";

export interface UserContextType {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);