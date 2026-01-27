import React, { createContext, ReactNode, useContext } from "react";

import { UseLessonGeneratorReturn } from "../useLessonGenerator";

// Define the context shape
type LessonContextType = UseLessonGeneratorReturn | null;

// Create Context
const LessonContext = createContext<LessonContextType>(null);

// Provider Component
// Provider Component
interface LessonProviderProps {
    children: ReactNode;
    value: UseLessonGeneratorReturn;
}

export const LessonProvider: React.FC<LessonProviderProps> = ({ children, value }) => {
    return (
        <LessonContext.Provider value={value}>
            {children}
        </LessonContext.Provider>
    );
};

// Custom Hook for Consumption
export const useLessonContext = () => {
    const context = useContext(LessonContext);
    if (!context) {
        throw new Error("useLessonContext must be used within a LessonProvider");
    }
    return context;
};
