import { useState, useCallback, useRef } from 'react';

export default function useModalHistory(initialState) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);

    const setState = useCallback((newState) => {
        setHistory((prev) => {
            const currentHistory = prev.slice(0, index + 1);
            return [...currentHistory, newState];
        });
        setIndex((prev) => prev + 1);
    }, [index]);

    const undo = useCallback(() => {
        if (index > 0) {
            setIndex((prev) => prev - 1);
            return history[index - 1]; // Return the state to restore
        }
        return null; // Nothing to undo
    }, [index, history]);

    const redo = useCallback(() => {
        if (index < history.length - 1) {
            setIndex((prev) => prev + 1);
            return history[index + 1]; // Return the state to restore
        }
        return null; // Nothing to redo
    }, [index, history]);

    // Retrieve current state from history
    const currentState = history[index];

    const canUndo = index > 0;
    const canRedo = index < history.length - 1;

    // Reset history (e.g., when loading a new model)
    const resetHistory = useCallback((newState) => {
        setHistory([newState]);
        setIndex(0);
    }, []);

    return {
        state: currentState,
        set: setState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory
    };
}
