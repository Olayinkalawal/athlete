"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, X, Clock, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomDrill {
  title: string;
  description: string;
  duration_minutes: number;
  difficulty: string;
  target_weakness: string;
  instructions: string[];
  why_it_helps: string;
}

interface CustomDrillsGeneratorProps {
  analysisText: string;
  poseDataSummary?: string;
  discipline: string;
  onDrillsGenerated?: () => void; // Callback to refresh drills list
}

export const CustomDrillsGenerator: React.FC<CustomDrillsGeneratorProps> = ({
  analysisText,
  poseDataSummary,
  discipline,
  onDrillsGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [drills, setDrills] = useState<CustomDrill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedDrill, setExpandedDrill] = useState<number | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisText,
          poseDataSummary,
          discipline
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate drills');
      }

      setDrills(data.drills);
      
      // Trigger refresh of drills list IMMEDIATELY (before modal)
      if (onDrillsGenerated) {
        onDrillsGenerated();
      }
      
      // Then show modal
      setShowModal(true);
      
      toast.success(
        data.saved > 0 
          ? `Generated & saved ${data.saved} custom drills! 🎯`
          : `Generated ${data.drills.length} custom drills! 🎯`
      );

    } catch (error: any) {
      console.error('Generate drills error:', error);
      toast.error(error.message || 'Failed to generate drills');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <>
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-500 disabled:to-zinc-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:shadow-none"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating Custom Drills...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Custom Drills
          </>
        )}
      </button>

      {/* Drills Modal */}
      {showModal && drills.length > 0 && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Custom Drills</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">AI-generated based on your analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            {/* Drills List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {drills.map((drill, index) => (
                <div
                  key={index}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50"
                >
                  {/* Drill Header */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                          {drill.title}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {drill.description}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(drill.difficulty)}`}>
                        {drill.difficulty}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{drill.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={14} />
                        <span>{drill.target_weakness}</span>
                      </div>
                    </div>
                  </div>

                  {/* Why It Helps */}
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start gap-2">
                      <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100 mb-1">Why This Helps</p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">{drill.why_it_helps}</p>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-4">
                    <button
                      onClick={() => setExpandedDrill(expandedDrill === index ? null : index)}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
                    >
                      {expandedDrill === index ? 'Hide' : 'Show'} Instructions
                    </button>

                    {expandedDrill === index && (
                      <ol className="space-y-2 mt-3">
                        {drill.instructions.map((instruction, i) => (
                          <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-medium">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <button
                onClick={() => {
                  setShowModal(false);
                  toast.success('Drills ready for training! 💪');
                }}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Start Training
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
