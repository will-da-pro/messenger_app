import {createContext, type Dispatch, type SetStateAction} from "react";
import type {Channel} from "../components/Dashboard.tsx";

export interface SelectedChannelContextType {
    selected: Channel | null;
    setSelected: Dispatch<SetStateAction<Channel | null>>;
}

export const SelectedChannelContext = createContext<SelectedChannelContextType | undefined>(undefined)