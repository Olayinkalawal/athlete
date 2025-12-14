"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useGuideTour, TourStep } from "./guide-tour-provider";

interface ElementRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function GuideTourOverlay() {
    const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useGuideTour();
    const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Find and track the target element
    useEffect(() => {
        if (!isActive || steps.length === 0) {
            setTargetRect(null);
            return;
        }

        const step = steps[currentStep];
        if (!step) return;

        const updatePosition = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const padding = step.spotlightPadding ?? 8;
            setTargetRect({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            });
        };

        const findElement = () => {
            const element = document.querySelector(step.target);
            if (element) {
                // Scroll element into view first
                element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

                // Update position multiple times as scroll settles
                setTimeout(() => updatePosition(element), 100);
                setTimeout(() => updatePosition(element), 300);
                setTimeout(() => updatePosition(element), 500);
            } else {
                // Element not found
                console.warn(`Tour element not found: ${step.target}`);
                setTargetRect(null);
            }
        };

        // Initial find with delay for DOM to settle
        const timeout = setTimeout(findElement, 150);

        // Recalculate on resize or scroll
        const handleUpdate = () => {
            const element = document.querySelector(step.target);
            if (element) {
                updatePosition(element);
            }
        };

        // Listen for scroll events on the main scroll container
        const mainScroll = document.getElementById('main-scroll');
        window.addEventListener("resize", handleUpdate);
        mainScroll?.addEventListener("scroll", handleUpdate);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("resize", handleUpdate);
            mainScroll?.removeEventListener("scroll", handleUpdate);
        };
    }, [isActive, currentStep, steps]);

    // Calculate tooltip position
    useEffect(() => {
        if (!targetRect || !tooltipRef.current || steps.length === 0) return;

        const step = steps[currentStep];
        const tooltip = tooltipRef.current;
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 16;

        let top = 0;
        let left = 0;

        switch (step?.placement || "bottom") {
            case "top":
                top = targetRect.top - tooltipRect.height - padding;
                left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                break;
            case "bottom":
                top = targetRect.top + targetRect.height + padding;
                left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                break;
            case "left":
                top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                left = targetRect.left - tooltipRect.width - padding;
                break;
            case "right":
                top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                left = targetRect.left + targetRect.width + padding;
                break;
        }

        // Keep tooltip within viewport
        const viewportPadding = 16;
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));

        setTooltipPosition({ top, left });
    }, [targetRect, currentStep, steps]);

    if (!mounted || !isActive || steps.length === 0) return null;

    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] pointer-events-none">
                {/* Dark overlay with spotlight cutout */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-auto"
                    onClick={skipTour}
                >
                    <svg className="w-full h-full">
                        <defs>
                            <mask id="spotlight-mask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {targetRect && (
                                    <motion.rect
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        x={targetRect.left}
                                        y={targetRect.top}
                                        width={targetRect.width}
                                        height={targetRect.height}
                                        rx="12"
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="rgba(0, 0, 0, 0.75)"
                            mask="url(#spotlight-mask)"
                        />
                    </svg>
                </motion.div>

                {/* Spotlight glow effect */}
                {targetRect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute pointer-events-none"
                        style={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                        }}
                    >
                        <div className="absolute inset-0 rounded-xl border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-pulse" />
                    </motion.div>
                )}

                {/* Tooltip */}
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute pointer-events-auto"
                    style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
                >
                    <div className="w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-500">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-white" />
                                <span className="text-sm font-medium text-white/80">
                                    Step {currentStep + 1} of {steps.length}
                                </span>
                            </div>
                            <button
                                onClick={skipTour}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                {step?.title}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {step?.content}
                            </p>
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5 pb-4">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i === currentStep
                                        ? "w-6 bg-indigo-500"
                                        : i < currentStep
                                            ? "w-1.5 bg-indigo-300"
                                            : "w-1.5 bg-zinc-300 dark:bg-zinc-600"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 p-4 pt-0">
                            <button
                                onClick={prevStep}
                                disabled={isFirstStep}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isFirstStep
                                    ? "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25"
                            >
                                {isLastStep ? "Finish" : "Next"}
                                {!isLastStep && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
