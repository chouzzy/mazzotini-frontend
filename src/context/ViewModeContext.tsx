'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ViewMode = 'associate' | 'client';

const STORAGE_KEY = 'mz_view_mode';

interface ViewModeCtx {
    viewMode: ViewMode;
    toggleViewMode: () => void;
    isDualRole: boolean;
    markAsDualRole: () => void;
}

const ViewModeContext = createContext<ViewModeCtx>({
    viewMode: 'associate',
    toggleViewMode: () => {},
    isDualRole: false,
    markAsDualRole: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>('associate');
    const [isDualRole, setIsDualRole] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ViewMode;
        if (stored === 'associate' || stored === 'client') setViewMode(stored);
    }, []);

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => {
            const next: ViewMode = prev === 'associate' ? 'client' : 'associate';
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const markAsDualRole = useCallback(() => setIsDualRole(true), []);

    return (
        <ViewModeContext.Provider value={{ viewMode, toggleViewMode, isDualRole, markAsDualRole }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export const useViewMode = () => useContext(ViewModeContext);
