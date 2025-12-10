"use client";

import React, { useState } from "react";
import Header from "@/components/layout/header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Bell, Moon, Palette, Save, User } from "lucide-react";
import { toast } from "sonner";
import { DISCIPLINES } from "@/lib/data";
import { useTheme } from "@/components/providers/theme-provider";
import { handleSpotlightMove } from "@/hooks/use-spotlight";
import { useUser } from "@clerk/nextjs";
import { useUi } from "@/components/providers/ui-provider";
import Image from "next/image";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const { sessionStats } = useUi();
  
  // Calculate level from XP (100 XP per level)
  const level = Math.max(1, Math.floor(sessionStats.totalXp / 100) + 1);
  
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_notifications: true,
    weekly_report: true,
    preferred_discipline: 'football',
    weekly_sessions_goal: 5
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, theme })
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Load settings from API on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(prev => ({
              ...prev,
              notifications_enabled: data.settings.notifications_enabled ?? true,
              email_notifications: data.settings.email_notifications ?? true,
              weekly_report: data.settings.weekly_report ?? true,
              preferred_discipline: data.settings.preferred_discipline || 'football',
              weekly_sessions_goal: data.settings.weekly_sessions_goal ?? 5
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Show skeleton while Clerk is loading user data
  if (!isLoaded) {
    return (
      <main className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
        <Header />
        <div className="p-4 md:p-8 max-w-[800px] mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          
          {/* Profile skeleton */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <Skeleton className="h-4 w-16 mb-4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Settings cards skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
          
          {/* Save button skeleton */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto h-full relative bg-zinc-50 dark:bg-black custom-scrollbar">
      <Header />
      
      <div className="p-4 md:p-8 max-w-[800px] mx-auto space-y-6">
        {/* Page Header */}
        <ScrollReveal className="space-y-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
              <p className="text-zinc-500 text-sm">Manage your profile and preferences</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Profile Section */}
        <ScrollReveal>
          <div className="spotlight-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <User size={18} className="text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Profile</h2>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
              <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900">
                {isLoaded && user?.imageUrl ? (
                  <Image 
                    src={user.imageUrl} 
                    alt={user.fullName || "Profile"}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <User size={24} className="text-zinc-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{user?.fullName || 'Athlete'}</h3>
                <p className="text-zinc-500 text-sm">{user?.primaryEmailAddress?.emailAddress || 'athlete@example.com'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
                    {sessionStats.totalXp.toLocaleString()} XP
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                    Level {level}
                  </span>
                  {sessionStats.currentStreak > 0 && (
                    <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-500 dark:text-orange-400 text-[10px] font-medium border border-orange-500/20">
                      🔥 {sessionStats.currentStreak} Day Streak
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Appearance */}
        <ScrollReveal>
          <div className="spotlight-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <Palette size={18} className="text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Appearance</h2>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Dark Mode</p>
                  <p className="text-xs text-zinc-500">Use dark theme for the interface</p>
                </div>
                <button 
                  onClick={handleThemeToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Notifications */}
        <ScrollReveal delay={50}>
          <div className="spotlight-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <Bell size={18} className="text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Push Notifications</p>
                  <p className="text-xs text-zinc-500">Receive alerts for sessions and updates</p>
                </div>
                <button 
                  onClick={() => handleToggle('notifications_enabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications_enabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${settings.notifications_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Email Notifications</p>
                  <p className="text-xs text-zinc-500">Get important updates via email</p>
                </div>
                <button 
                  onClick={() => handleToggle('email_notifications')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.email_notifications ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${settings.email_notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">Weekly Report</p>
                  <p className="text-xs text-zinc-500">Receive weekly training summaries</p>
                </div>
                <button 
                  onClick={() => handleToggle('weekly_report')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.weekly_report ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${settings.weekly_report ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Preferred Discipline */}
        <ScrollReveal delay={100}>
          <div className="spotlight-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm" onMouseMove={handleSpotlightMove}>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <Moon size={18} className="text-zinc-500" />
              <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Training Preferences</h2>
            </div>
            <div className="relative z-10">
              <label className="text-sm text-zinc-700 dark:text-zinc-300 block mb-2">Preferred Discipline</label>
              <select 
                value={settings.preferred_discipline}
                onChange={(e) => setSettings(prev => ({ ...prev, preferred_discipline: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {DISCIPLINES.map(d => (
                  <option key={d.slug} value={d.slug}>{d.name}</option>
                ))}
              </select>
              
              {/* Weekly Goal Setting */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <label className="text-sm text-zinc-700 dark:text-zinc-300 block mb-2">Weekly Session Goal</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={settings.weekly_sessions_goal}
                    onChange={(e) => setSettings(prev => ({ ...prev, weekly_sessions_goal: parseInt(e.target.value) }))}
                    className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 min-w-[80px] text-right">
                    {settings.weekly_sessions_goal} sessions
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Set your weekly training target to stay on track</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Save Button */}
        <ScrollReveal delay={150}>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </ScrollReveal>
      </div>
    </main>
  );
}
