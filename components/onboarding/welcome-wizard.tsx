"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronRight, Check, Activity, Target, Zap } from "lucide-react";
import { DISCIPLINES } from "@/lib/data";
import { toast } from "sonner";
import { useUi } from "@/components/providers/ui-provider";

interface WelcomeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function WelcomeWizard({ isOpen, onClose, userId }: WelcomeWizardProps) {
  const [step, setStep] = useState(0);
  const [discipline, setDiscipline] = useState("football");
  const [goal, setGoal] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refetchStats } = useUi();

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_discipline: discipline,
          weekly_sessions_goal: goal,
          onboarding_completed: true
        })
      });

      const data = await res.json();
      console.log('ONBOARDING SAVE RESPONSE:', res.status, data);

      if (res.ok) {
        toast.success("All set! Let's start training.");
        await refetchStats(); // Refresh stats to reflect new goal
        onClose();
      } else {
        console.error('ONBOARDING SAVE ERROR:', data);
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error('ONBOARDING EXCEPTION:', error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to Athlete Dashboard",
      description: "Your personal AI-powered training companion. Let's get your profile set up in less than a minute.",
      icon: <Trophy className="w-12 h-12 text-yellow-500" />,
      content: (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-sm">
            Track your progress, analyze your technique, and reach your peak performance with data-driven insights.
          </p>
        </div>
      )
    },
    // Step 1: Select Discipline
    {
      title: "Choose Your Sport",
      description: "We'll tailor your experience and drills based on your primary discipline.",
      icon: <Activity className="w-6 h-6 text-indigo-500" />,
      content: (
        <div className="grid grid-cols-2 gap-3 py-4">
          {DISCIPLINES.map((d) => {
            const isSelected = discipline === d.slug;
            return (
              <button
                key={d.slug}
                onClick={() => setDiscipline(d.slug)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  {/* Icon removed to fix build error */}
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {d.name}
                </span>
              </button>
            );
          })}
        </div>
      )
    },
    // Step 2: Set Goal
    {
      title: "Set a Weekly Goal",
      description: "Consistency is key. How many training sessions do you want to complete each week?",
      icon: <Target className="w-6 h-6 text-emerald-500" />,
      content: (
        <div className="py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-zinc-500">1 Session</span>
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{goal}</span>
            <span className="text-sm font-medium text-zinc-500">7 Sessions</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={goal}
            onChange={(e) => setGoal(parseInt(e.target.value))}
            className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <p className="text-center text-sm text-zinc-500 mt-6">
            We recommend starting with 3 sessions/week for steady progress.
          </p>
        </div>
      )
    },
    // Step 3: Ready
    {
      title: "You're All Set!",
      description: "Your dashboard is ready. Start your first session or explore available drills.",
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ready to Grind?</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-sm">
            Check out the "Overview" page to track your weekly progress and discover new drills.
          </p>
        </div>
      )
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
      >
        {/* Progress Bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800 w-full">
          <motion.div
            className="h-full bg-indigo-600"
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col h-full min-h-[300px]">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{currentStep.title}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">{currentStep.description}</p>
                </div>

                <div className="flex-1">
                  {currentStep.content}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors ${step === 0 ? 'invisible' : ''}`}
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all active:scale-95"
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Setting up...' : 'Get Started'}
                <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
