"use client";

import { Check, Info, Plus } from "lucide-react";
import React, { useState } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useUi } from "@/components/providers/ui-provider";
import { toast } from "sonner";

export default function SessionPlan() {
  const { sessionPlanItems, toggleSessionItem, resetSessionPlan, addSessionItem } = useUi();
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const completedCount = sessionPlanItems.filter(i => i.checked).length;
  const progress = Math.round((completedCount / sessionPlanItems.length) * 100);

  const handleAddDrill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addSessionItem(newItemName);
    setNewItemName("");
    setIsAdding(false);
  };

  return (
    <ScrollReveal data-tour="session-plan" className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Session Plan</h3>
        <button onClick={resetSessionPlan} className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:underline">Reset All</button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-1">
        {sessionPlanItems.map((item) => (
          <label key={item.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
            <div className="relative flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleSessionItem(item.id)}
                className="sr-only"
              />
              <div className={`h-4 w-4 rounded border transition-all flex items-center justify-center ${item.checked
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                }`}>
                {item.checked && <Check className="text-white" size={10} />}
              </div>
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium transition-colors ${item.checked ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {item.label}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                const drillDurations: Record<string, string> = {
                  'Warm-up': '5-10 min',
                  'Jogging': '5-10 min',
                  'Dribbling': '10-15 min',
                  'Pass': '10-15 min',
                  'Penalty': '15-20 min',
                  'Shots': '15-20 min'
                };
                const getDuration = () => {
                  for (const key of Object.keys(drillDurations)) {
                    if (item.label.toLowerCase().includes(key.toLowerCase())) {
                      return drillDurations[key];
                    }
                  }
                  return '10-15 min';
                };
                const xp = item.label.toLowerCase().includes('warm') ? 10 : item.label.toLowerCase().includes('penalty') ? 30 : 20;
                toast.info(`📋 ${item.label}`, {
                  description: `Duration: ${getDuration()}\nXP Reward: +${xp} XP\nStatus: ${item.checked ? 'Completed ✓' : 'Pending'}`
                });
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Info size={14} />
            </button>
          </label>
        ))}
      </div>

      {isAdding ? (
        <form onSubmit={handleAddDrill} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            autoFocus
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-700 dark:text-white focus:outline-none focus:border-indigo-500"
            placeholder="Drill name..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={() => !newItemName && setIsAdding(false)}
          />
          <button type="submit" className="bg-indigo-600 text-white rounded p-1.5 hover:bg-indigo-500" disabled={!newItemName}>
            <Plus size={14} />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mt-4 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 text-xs hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
        >
          + Add Custom Drill
        </button>
      )}
    </ScrollReveal>
  );
}
