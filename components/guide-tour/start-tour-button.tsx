"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, RotateCcw } from "lucide-react";
import { useGuideTour, useTourCompleted, DASHBOARD_TOUR_STEPS, DISCIPLINE_TOUR_STEPS, PROGRESS_TOUR_STEPS, AICOACH_TOUR_STEPS } from "./guide-tour-provider";
import { toast } from "sonner";

interface StartTourButtonProps {
    variant?: "icon" | "button" | "text";
    className?: string;
}

export function StartTourButton({ variant = "button", className = "" }: StartTourButtonProps) {
    const { startTour, isActive } = useGuideTour();
    const { resetTour } = useTourCompleted();
    const pathname = usePathname();

    // Detect which page we're on and select appropriate tour
    const getTourConfig = () => {
        if (pathname?.startsWith('/disciplines/')) {
            return { steps: DISCIPLINE_TOUR_STEPS, name: "discipline page" };
        }
        if (pathname === '/progress') {
            return { steps: PROGRESS_TOUR_STEPS, name: "progress" };
        }
        if (pathname === '/ai-coach') {
            return { steps: AICOACH_TOUR_STEPS, name: "AI Coach" };
        }
        // Default to dashboard (home page)
        return { steps: DASHBOARD_TOUR_STEPS, name: "dashboard" };
    };

    const { steps: tourSteps, name: tourName } = getTourConfig();

    const handleStartTour = () => {
        if (isActive) return;

        // Reset the completed flag so tour can be shown again
        resetTour();

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            startTour(tourSteps);
            toast.success(`Starting ${tourName} tour! 🎓`);
        }, 100);
    };

    if (variant === "icon") {
        return (
            <button
                onClick={handleStartTour}
                disabled={isActive}
                className={`p-2 rounded-lg text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50 ${className}`}
                title={`Start ${tourName} Tour`}
            >
                <HelpCircle size={18} />
            </button>
        );
    }

    if (variant === "text") {
        return (
            <button
                onClick={handleStartTour}
                disabled={isActive}
                className={`text-sm text-indigo-500 hover:text-indigo-400 hover:underline disabled:opacity-50 flex items-center gap-1.5 ${className}`}
            >
                <RotateCcw size={14} />
                Restart Tour
            </button>
        );
    }

    return (
        <button
            onClick={handleStartTour}
            disabled={isActive}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-md ${className}`}
        >
            <HelpCircle size={16} />
            Take a Tour
        </button>
    );
}
