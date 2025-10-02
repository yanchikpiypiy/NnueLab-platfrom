import { useState, useCallback } from 'react';

export const useSetupMode = (initialSetup = true) => {
    const [setupMode, setSetupMode] = useState(initialSetup);
    const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);

    const toggleSetupMode = useCallback(() => {
        setSetupMode(prev => !prev);
    }, []);

    const enterSetupMode = useCallback(() => {
        setSetupMode(true);
    }, []);

    const exitSetupMode = useCallback(() => {
        setSetupMode(false);
    }, []);

    return {
        setupMode,
        selectedProblemIndex,
        setSetupMode,
        setSelectedProblemIndex,
        toggleSetupMode,
        enterSetupMode,
        exitSetupMode,
    };
};
