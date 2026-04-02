import {createContext, type Dispatch, type SetStateAction} from "react";
import type {Channel} from "../components/Dashboard.tsx";

export interface ChannelsContextType {
    channels: Channel[] | null;
    setChannels: Dispatch<SetStateAction<Channel[] | null>>;
}

export const ChannelsContext = createContext<ChannelsContextType | undefined>(undefined);