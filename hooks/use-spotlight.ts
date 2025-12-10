"use client";

import { MouseEvent, useCallback } from "react";

/**
 * Hook to handle spotlight/flashlight effect on cards
 * Usage: <div className="spotlight-card" onMouseMove={handleSpotlight}>
 */
export function useSpotlight() {
    const handleSpotlight = useCallback((e: MouseEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    return { handleSpotlight };
}

/**
 * Standalone function for use in components that don't need a hook
 */
export function handleSpotlightMove(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
}
