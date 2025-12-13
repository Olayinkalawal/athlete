"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, SkipForward } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useUi } from "@/components/providers/ui-provider";

interface WelcomeWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Product Tour Slides - curated for impact (6 essential slides)
const TOUR_SLIDES = [
  { src: "/onboarding/hero-intro.svg", alt: "Welcome to Athlete Dashboard" },
  { src: "/onboarding/dashboard-overview.svg", alt: "Your Command Center" },
  { src: "/onboarding/core-loop.svg", alt: "Upload, Analyze, Improve" },
  { src: "/onboarding/track-progress.svg", alt: "Track Your Progress" },
  { src: "/onboarding/coach-nova.svg", alt: "Meet Coach Nova" },
  { src: "/onboarding/closing-cta.svg", alt: "Start Training Smarter" },
];

export default function WelcomeWizard({ isOpen, onClose }: WelcomeWizardProps) {
  const [tourIndex, setTourIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchStats } = useUi();

  const handleStartTraining = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_completed: true
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Let's start training!");
        await refetchStats();
        onClose();
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTourSlide = () => {
    if (tourIndex < TOUR_SLIDES.length - 1) {
      setTourIndex(tourIndex + 1);
    }
  };

  const prevTourSlide = () => {
    if (tourIndex > 0) {
      setTourIndex(tourIndex - 1);
    }
  };

  const skipTour = async () => {
    await handleStartTraining();
  };

  const goToDot = (index: number) => {
    setTourIndex(index);
  };

  const isLastSlide = tourIndex === TOUR_SLIDES.length - 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden min-h-[520px] flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {/* Skip button */}
        <button
          onClick={skipTour}
          disabled={isSubmitting}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-sm disabled:opacity-50"
        >
          <SkipForward className="w-4 h-4" />
          Skip Tour
        </button>

        {/* Slide Image */}
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={tourIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={TOUR_SLIDES[tourIndex].src}
                alt={TOUR_SLIDES[tourIndex].alt}
                fill
                className="object-contain p-2"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-200 dark:border-zinc-800">
          {/* Back button */}
          <button
            onClick={prevTourSlide}
            disabled={tourIndex === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border transition-all ${tourIndex === 0
              ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
              : "border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500"
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goToDot(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === tourIndex
                  ? "w-6 bg-indigo-500"
                  : i < tourIndex
                    ? "bg-indigo-300"
                    : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
                  }`}
              />
            ))}
          </div>

          {/* Next / Start Training button */}
          {isLastSlide ? (
            <button
              onClick={handleStartTraining}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Starting..." : "Start Training"}
            </button>
          ) : (
            <button
              onClick={nextTourSlide}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
