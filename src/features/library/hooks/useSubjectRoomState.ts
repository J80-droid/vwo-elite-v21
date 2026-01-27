import { useCallback, useReducer } from "react";

export type ModalType = "text" | "url" | "youtube" | "search" | "wikipedia" | "saveSet" | "loadSet" | null;
export type TabType = "overview" | "literature" | "skills" | "mondeling" | "solver";

interface SubjectRoomState {
    activeModal: ModalType;
    modalTitle: string;
    modalValue: string;
    isConfigOpen: boolean;
    isGraphOpen: boolean;
    activeTab: TabType;
    searchQuery: string;
    lessonSearchQuery: string;
    selectedImage: string | null;
    activeGraphNodeId: string | undefined;
    topic: string;
    modes: Set<string>;
}

type Action =
    | { type: "OPEN_MODAL"; payload: { type: ModalType; title?: string } }
    | { type: "CLOSE_MODAL" }
    | { type: "SET_MODAL_VALUE"; payload: string }
    | { type: "SET_TITLE"; payload: string }
    | { type: "SET_TAB"; payload: TabType }
    | { type: "SET_SEARCH"; payload: string }
    | { type: "SET_LESSON_SEARCH"; payload: string }
    | { type: "TOGGLE_CONFIG"; payload: boolean }
    | { type: "TOGGLE_GRAPH"; payload: boolean }
    | { type: "SET_TOPIC"; payload: string }
    | { type: "TOGGLE_MODE"; payload: string }
    | { type: "SELECT_NODE"; payload: string | undefined }
    | { type: "SELECT_IMAGE"; payload: string | null };

const initialState: SubjectRoomState = {
    activeModal: null,
    modalTitle: "",
    modalValue: "",
    isConfigOpen: false,
    isGraphOpen: false,
    activeTab: "overview",
    searchQuery: "",
    lessonSearchQuery: "",
    selectedImage: null,
    activeGraphNodeId: undefined,
    topic: "",
    modes: new Set(["recap"]),
};

function subjectRoomReducer(state: SubjectRoomState, action: Action): SubjectRoomState {
    switch (action.type) {
        case "OPEN_MODAL":
            return {
                ...state,
                activeModal: action.payload.type,
                modalTitle: action.payload.title || "",
                modalValue: ""
            };
        case "CLOSE_MODAL":
            return { ...state, activeModal: null, modalValue: "", modalTitle: "" };
        case "SET_MODAL_VALUE":
            return { ...state, modalValue: action.payload };
        case "SET_TITLE":
            return { ...state, modalTitle: action.payload };
        case "SET_TAB":
            return { ...state, activeTab: action.payload };
        case "SET_SEARCH":
            return { ...state, searchQuery: action.payload };
        case "SET_LESSON_SEARCH":
            return { ...state, lessonSearchQuery: action.payload };
        case "TOGGLE_CONFIG":
            return { ...state, isConfigOpen: action.payload };
        case "TOGGLE_GRAPH":
            return { ...state, isGraphOpen: action.payload };
        case "SET_TOPIC":
            return { ...state, topic: action.payload };
        case "SELECT_NODE":
            return { ...state, activeGraphNodeId: action.payload };
        case "SELECT_IMAGE":
            return { ...state, selectedImage: action.payload };
        case "TOGGLE_MODE": {
            const newModes = new Set(state.modes);
            if (newModes.has(action.payload)) newModes.delete(action.payload);
            else newModes.add(action.payload);
            return { ...state, modes: newModes };
        }
        default:
            return state;
    }
}

export const useSubjectRoomState = () => {
    const [state, dispatch] = useReducer(subjectRoomReducer, initialState);

    // Stable Handlers
    const handlers = {
        openModal: useCallback((type: ModalType, title?: string) => dispatch({ type: "OPEN_MODAL", payload: { type, title } }), []),
        closeModal: useCallback(() => dispatch({ type: "CLOSE_MODAL" }), []),
        setModalValue: useCallback((val: string) => dispatch({ type: "SET_MODAL_VALUE", payload: val }), []),
        setModalTitle: useCallback((val: string) => dispatch({ type: "SET_TITLE", payload: val }), []),
        setActiveTab: useCallback((tab: TabType) => dispatch({ type: "SET_TAB", payload: tab }), []),
        setSearchQuery: useCallback((q: string) => dispatch({ type: "SET_SEARCH", payload: q }), []),
        setLessonSearchQuery: useCallback((q: string) => dispatch({ type: "SET_LESSON_SEARCH", payload: q }), []),
        setIsConfigOpen: useCallback((open: boolean) => dispatch({ type: "TOGGLE_CONFIG", payload: open }), []),
        setIsGraphOpen: useCallback((open: boolean) => dispatch({ type: "TOGGLE_GRAPH", payload: open }), []),
        setTopic: useCallback((t: string) => dispatch({ type: "SET_TOPIC", payload: t }), []),
        setActiveGraphNodeId: useCallback((id: string | undefined) => dispatch({ type: "SELECT_NODE", payload: id }), []),
        setSelectedImage: useCallback((img: string | null) => dispatch({ type: "SELECT_IMAGE", payload: img }), []),
        toggleMode: useCallback((mode: string) => dispatch({ type: "TOGGLE_MODE", payload: mode }), []),
    };

    return {
        ...state,
        ...handlers,
        // Aliases for backward compatibility
        setActiveModal: handlers.openModal,
        resetModal: handlers.closeModal,
    };
};
