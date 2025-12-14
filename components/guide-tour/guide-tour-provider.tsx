"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Tour step configuration
export interface TourStep {
    id: string;
    target: string; // CSS selector for the element to highlight
    title: string;
    content: string;
    placement?: "top" | "bottom" | "left" | "right";
    spotlightPadding?: number;
}

// Tour context type
interface GuideTourContextType {
    isActive: boolean;
    currentStep: number;
    steps: TourStep[];
    startTour: (steps: TourStep[]) => void;
    endTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (index: number) => void;
    skipTour: () => void;
}

const GuideTourContext = createContext<GuideTourContextType | undefined>(undefined);

// Default tour steps for the Athlete Dashboard
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
    {
        id: "stats-overview",
        target: '[data-tour="stats-overview"]',
        title: "📊 Track Your Progress",
        content: "Monitor your training stats in real-time. See your level, XP, current streak, and weekly session goals all in one place. Click on the weekly goal to view detailed progress!",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "continue-training",
        target: '[data-tour="continue-training"]',
        title: "🏃 Quick Start Training",
        content: "Jump straight into training! This card auto-rotates through all available disciplines. Click to start a training session with video upload and AI analysis.",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "ai-coach",
        target: '[data-tour="ai-coach"]',
        title: "🤖 Meet Coach Nova",
        content: "Your personal AI coach is here to help! Ask questions about your training, get tips, and receive personalized advice. Try asking 'How can I improve my technique?' or 'What drills should I do today?'",
        placement: "left",
        spotlightPadding: 12,
    },
    {
        id: "session-plan",
        target: '[data-tour="session-plan"]',
        title: "📋 Your Session Plan",
        content: "Track your daily training tasks here. Check off drills as you complete them to earn XP and build your streak. Your session updates in real-time as you train!",
        placement: "left",
        spotlightPadding: 12,
    },
    {
        id: "drills-section",
        target: '[data-tour="drills-section"]',
        title: "⚡ Personalized Drills",
        content: "Drills recommended just for you based on your performance. Complete them to earn XP! Upload a video and our AI will generate custom drills tailored to your technique.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "disciplines-section",
        target: '[data-tour="disciplines-section"]',
        title: "🎯 Choose Your Discipline",
        content: "Explore all available sports and activities. Each discipline has its own drills, video analysis, and AI coaching. Click any discipline to start training!",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "header-tour-button",
        target: '[title="Start Dashboard Tour"]',
        title: "❓ Need Help?",
        content: "You can restart this tour anytime by clicking the help icon here. Happy training! 🎉",
        placement: "bottom",
        spotlightPadding: 8,
    },
];

// Discipline page tour steps - in logical order of use
export const DISCIPLINE_TOUR_STEPS: TourStep[] = [
    {
        id: "discipline-upload-btn",
        target: '[data-tour="discipline-upload-btn"]',
        title: "📤 Step 1: Upload Video",
        content: "Start here! Click to upload a training video. Record yourself practicing and our AI will analyze your technique, form, and movement patterns.",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "discipline-video-player",
        target: '[data-tour="discipline-video-player"]',
        title: "🎬 Step 2: Video Player",
        content: "Your uploaded video appears here. Watch it back to see your technique. Use the playback controls to pause, skip, or adjust volume.",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "discipline-pose-btn",
        target: '[data-tour="discipline-pose-btn"]',
        title: "🦴 Step 3: Pose Detection",
        content: "Toggle the Pose button to see real-time skeleton overlay! Key joints for your sport are highlighted in yellow for easy analysis.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "discipline-analyze-btn",
        target: '[data-tour="discipline-analyze-btn"]',
        title: "🤖 Step 4: AI Analysis",
        content: "Click to start AI analysis! You'll see a thumbnail preview of all frames with skeleton overlay. Confirm to send to Coach Nova for personalized feedback.",
        placement: "left",
        spotlightPadding: 12,
    },
    {
        id: "discipline-analysis-results",
        target: '[data-tour="discipline-analysis-results"]',
        title: "📊 Step 5: Analysis Results",
        content: "Your AI feedback appears here! View detailed technique analysis, check past analyses in History, and generate custom drills from the feedback.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "discipline-export-btns",
        target: '[data-tour="discipline-export-btns"]',
        title: "📤 Step 6: Export & Share",
        content: "Copy your analysis to clipboard, download as a text file, or share with your coach! Great for tracking progress over time.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "discipline-compare-btn",
        target: '[data-tour="discipline-compare-btn"]',
        title: "📈 Step 7: Compare Progress",
        content: "Go to History tab and click Compare Progress to select two analyses and view them side-by-side. See how your technique has improved!",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "discipline-drills",
        target: '[data-tour="discipline-drills"]',
        title: "⚡ Step 8: Practice Drills",
        content: "Complete these drills to improve! Each drill earns XP. After AI analysis, custom drills tailored to your weaknesses appear here.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "discipline-session-plan",
        target: '[data-tour="session-plan"]',
        title: "📋 Step 9: Session Plan",
        content: "Track your training tasks! Check off drills as you complete them to earn XP and build your streak. Add custom drills to personalize your session.",
        placement: "left",
        spotlightPadding: 12,
    },
];

// Progress page tour steps
export const PROGRESS_TOUR_STEPS: TourStep[] = [
    {
        id: "progress-level-card",
        target: '[data-tour="progress-level-card"]',
        title: "🏆 Your Level & XP",
        content: "See your current level and total XP at a glance! The progress bar shows how close you are to leveling up.",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "progress-stats-grid",
        target: '[data-tour="progress-stats-grid"]',
        title: "📊 Key Stats",
        content: "Track your most important metrics: current streak, drills completed, training time, and your longest streak ever!",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "progress-weekly-goal",
        target: '[data-tour="progress-weekly-goal"]',
        title: "🎯 Weekly Goal",
        content: "Monitor your weekly session goal. Try to hit 100% each week to maintain momentum and build healthy training habits!",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "progress-xp-chart",
        target: '[data-tour="progress-xp-chart"]',
        title: "📈 XP Trend",
        content: "Visualize your XP earned over time. Use the 7 Days or 30 Days buttons to see short or long-term trends.",
        placement: "top",
        spotlightPadding: 12,
    },
    {
        id: "progress-activity",
        target: '[data-tour="progress-activity"]',
        title: "⚡ Recent Activity",
        content: "See your latest completed drills and the XP you earned. Great for tracking what you've accomplished!",
        placement: "top",
        spotlightPadding: 12,
    },
];

// AI Coach page tour steps
export const AICOACH_TOUR_STEPS: TourStep[] = [
    {
        id: "aicoach-chat",
        target: '[data-tour="aicoach-chat"]',
        title: "🤖 Chat with Coach Nova",
        content: "This is your AI training assistant! Ask questions about technique, request training tips, or get personalized advice based on your performance.",
        placement: "bottom",
        spotlightPadding: 12,
    },
    {
        id: "aicoach-quick-prompts",
        target: '[data-tour="aicoach-quick-prompts"]',
        title: "⚡ Quick Prompts",
        content: "Use these shortcuts to quickly ask common questions. Click any prompt to instantly send it to Coach Nova!",
        placement: "top",
        spotlightPadding: 12,
    },
];

interface GuideTourProviderProps {
    children: ReactNode;
}

export function GuideTourProvider({ children }: GuideTourProviderProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);

    const startTour = useCallback((tourSteps: TourStep[]) => {
        setSteps(tourSteps);
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const endTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
        setSteps([]);
        // Mark tour as completed in localStorage
        if (typeof window !== "undefined") {
            localStorage.setItem("athlete-dashboard-tour-completed", "true");
        }
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            endTour();
        }
    }, [currentStep, steps.length, endTour]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((index: number) => {
        if (index >= 0 && index < steps.length) {
            setCurrentStep(index);
        }
    }, [steps.length]);

    const skipTour = useCallback(() => {
        endTour();
    }, [endTour]);

    return (
        <GuideTourContext.Provider
            value={{
                isActive,
                currentStep,
                steps,
                startTour,
                endTour,
                nextStep,
                prevStep,
                goToStep,
                skipTour,
            }}
        >
            {children}
        </GuideTourContext.Provider>
    );
}

export function useGuideTour() {
    const context = useContext(GuideTourContext);
    if (context === undefined) {
        throw new Error("useGuideTour must be used within a GuideTourProvider");
    }
    return context;
}

// Helper hook to check if tour has been completed
export function useTourCompleted() {
    const [completed, setCompleted] = useState(true); // Default true to prevent flash

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isCompleted = localStorage.getItem("athlete-dashboard-tour-completed") === "true";
            setCompleted(isCompleted);
        }
    }, []);

    const resetTour = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("athlete-dashboard-tour-completed");
            setCompleted(false);
        }
    }, []);

    return { completed, resetTour };
}
