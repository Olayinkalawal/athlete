"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SessionItem, SESSION_ITEMS, ChatMessage } from "@/lib/data";
import { useUser } from "@clerk/nextjs";
import WelcomeWizard from "../onboarding/welcome-wizard";

interface SessionStats {
  caloriesBurned: number;
  timeElapsed: number; // in minutes
  completedDrills: number;
  totalSessions: number;
  avgAccuracy: number;
  currentStreak: number;
  totalXp: number;
}

interface UiContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isSearchOpen: boolean;
  toggleSearch: () => void;
  notifications: number;
  clearNotifications: () => void;
  sessionStats: SessionStats;
  updateSessionStats: (stats: Partial<SessionStats>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoadingStats: boolean;
  statsError: string | null;
  refetchStats: () => Promise<void>;
  // Session Plan
  sessionPlanItems: SessionItem[];
  toggleSessionItem: (id: string) => void;
  resetSessionPlan: () => void;
  addSessionItem: (label: string) => void;
  startNewSession: () => Promise<void>;
  currentSessionId: string | null;
  isSessionSynced: boolean;
  // Chat Messages
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, text: string) => void;
  setChatTyping: (typing: boolean) => void;
  isChatTyping: boolean;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

const DEFAULT_STATS: SessionStats = {
  caloriesBurned: 0,
  timeElapsed: 0,
  completedDrills: 0,
  totalSessions: 0,
  avgAccuracy: 0,
  currentStreak: 0,
  totalXp: 0,
};

const SESSION_PLAN_STORAGE_KEY = 'athlete-dashboard-session-plan';
const CHAT_MESSAGES_STORAGE_KEY = 'athlete-dashboard-chat-messages';

// Helper to load session plan from localStorage
const loadSessionPlanFromStorage = (): SessionItem[] => {
  if (typeof window === 'undefined') return SESSION_ITEMS;
  try {
    const stored = localStorage.getItem(SESSION_PLAN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading session plan from storage:', error);
  }
  return SESSION_ITEMS;
};

// Helper to save session plan to localStorage
const saveSessionPlanToStorage = (items: SessionItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_PLAN_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving session plan to storage:', error);
  }
};

// Helper to load chat messages from localStorage
const loadChatMessagesFromStorage = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading chat messages from storage:', error);
  }
  return [];
};

// Helper to save chat messages to localStorage
const saveChatMessagesToStorage = (messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    // Only keep last 50 messages to prevent storage bloat
    const messagesToStore = messages.slice(-50);
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messagesToStore));
  } catch (error) {
    console.error('Error saving chat messages to storage:', error);
  }
};

export function UiProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionStats, setSessionStats] = useState<SessionStats>(DEFAULT_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [sessionPlanItems, setSessionPlanItems] = useState<SessionItem[]>(SESSION_ITEMS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionSynced, setIsSessionSynced] = useState(false);
  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { user } = useUser();

  // Load session plan from database or localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Try to fetch from database first
        const response = await fetch('/api/sessions/current');
        if (response.ok) {
          const data = await response.json();
          if (data.session && data.items?.length > 0) {
            setCurrentSessionId(data.session.id);
            // Map database items to SessionItem format
            const dbItems: SessionItem[] = data.items.map((item: any) => ({
              id: item.id,
              label: item.label,
              checked: item.checked
            }));
            setSessionPlanItems(dbItems);
            setIsSessionSynced(true);
            setIsHydrated(true);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load session from database:', error);
      }
      
      // Fallback to localStorage
      const storedItems = loadSessionPlanFromStorage();
      setSessionPlanItems(storedItems);
      setIsHydrated(true);
    };

    loadSession();
    
    // Load chat messages from localStorage
    const storedMessages = loadChatMessagesFromStorage();
    setChatMessages(storedMessages);
  }, []);



  // Realtime Notifications Subscription
  useEffect(() => {
    if (!supabase) return;

    // Listen for changes to user_stats (XP, Level, etc)
    const statsSubscription = supabase
      .channel('realtime-stats')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_stats' },
        (payload: any) => {
          // Check if XP increased
          if (payload.new.total_xp > payload.old.total_xp) {
            const xpGained = payload.new.total_xp - payload.old.total_xp;
            toast.success(`You gained ${xpGained} XP! 🚀`, {
              description: `Total XP: ${payload.new.total_xp}`,
            });
            // Update local state to match
            setSessionStats(prev => ({ ...prev, totalXp: payload.new.total_xp }));
          }
        }
      )
      .subscribe();

    // Listen for new sessions
    const sessionSubscription = supabase
      .channel('realtime-sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sessions' },
        (payload: any) => {
             toast.info("New Training Session Started ⏱️", {
                description: payload.new.title
             });
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(statsSubscription);
        supabase.removeChannel(sessionSubscription);
      }
    };
  }, []);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      
      const response = await fetch('/api/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      
      if (data.stats) {
        setSessionStats({
          caloriesBurned: data.stats.total_calories_burned || 0,
          timeElapsed: data.stats.total_training_minutes || 0,
          completedDrills: data.stats.total_drills_completed || 0,
          totalSessions: data.stats.total_sessions || 0,
          avgAccuracy: Math.round(data.stats.avg_accuracy || 0),
          currentStreak: data.stats.current_streak || 0,
          totalXp: data.stats.total_xp || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStatsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Initial Data Load Sequence
  useEffect(() => {
    if (!user) return; // Wait for Clerk user to be loaded

    const initializeUser = async () => {
      try {
        // 1. Sync User with Supabase (Critical Step)
        // This ensures the user record exists before we try to fetch settings or stats
        console.log("SYNC: Starting user sync...");
        const syncRes = await fetch('/api/user/sync', { method: 'POST' });
        const syncData = await syncRes.json();
        console.log("SYNC: Result:", syncRes.status, syncData);

        if (!syncRes.ok) {
          console.error("SYNC: Failed!", syncData);
          toast.error("Failed to initialize user. Please refresh the page.");
          return; // Stop here if sync failed
        }

        // 2. Load Data (Stats & Onboarding)
        // Now safe to call because user exists in DB
        await Promise.all([
          fetchStats(),
          (async () => {
            const settingsRes = await fetch('/api/settings');
            if (settingsRes.ok) {
              const data = await settingsRes.json();
              console.log("SETTINGS: Loaded", data.settings);
              // If onboarding_completed is explicitly false, show wizard
              if (data.settings && data.settings.onboarding_completed === false) {
                 console.log("ONBOARDING: Triggering wizard");
                 // Wait a moment to ensure everything is loaded
                 setTimeout(() => setOnboardingOpen(true), 500);
              } else {
                 console.log("ONBOARDING: Skipped. Completed:", data.settings?.onboarding_completed);
              }
            } else {
              console.error("SETTINGS: Failed to load", settingsRes.status);
            }
          })()
        ]);

      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load user data. Please refresh the page.");
      }
    };

    initializeUser();
  }, [user, fetchStats]);



  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSearch = () => setIsSearchOpen((prev) => !prev);
  const clearNotifications = () => setNotifications(0);
  
  const updateSessionStats = (delta: Partial<SessionStats>) => {
    setSessionStats(prev => ({
      ...prev,
      caloriesBurned: prev.caloriesBurned + (delta.caloriesBurned || 0),
      timeElapsed: prev.timeElapsed + (delta.timeElapsed || 0),
      completedDrills: prev.completedDrills + (delta.completedDrills || 0),
      totalSessions: prev.totalSessions + (delta.totalSessions || 0),
      totalXp: prev.totalXp + (delta.totalXp || 0),
    }));
  };

  // Session Plan management
  const toggleSessionItem = async (id: string) => {
    const item = sessionPlanItems.find(i => i.id === id);
    if (!item) return;
    
    const isNowChecked = !item.checked;
    
    // Update local state immediately for responsiveness
    setSessionPlanItems(prev =>
      prev.map(i => i.id === id ? { ...i, checked: isNowChecked } : i)
    );
    
    // Update stats
    if (isNowChecked) {
      updateSessionStats({
        caloriesBurned: Math.floor(Math.random() * 50) + 10,
        completedDrills: 1
      });
    } else {
      updateSessionStats({
        caloriesBurned: -10,
        completedDrills: -1
      });
    }
    
    // Sync to database if we have an active session
    if (isSessionSynced && currentSessionId) {
      try {
        await fetch('/api/sessions/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, checked: isNowChecked })
        });
      } catch (error) {
        console.error('Failed to sync item toggle:', error);
      }
    }
  };

  const resetSessionPlan = async () => {
    // Reset local state
    setSessionPlanItems(prev => prev.map(i => ({ ...i, checked: false })));
    toast.info("Session plan reset.");
    
    // Sync each item to database
    if (isSessionSynced && currentSessionId) {
      for (const item of sessionPlanItems) {
        try {
          await fetch('/api/sessions/items', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, checked: false })
          });
        } catch (error) {
          console.error('Failed to sync reset:', error);
        }
      }
    }
  };

  const addSessionItem = async (label: string) => {
    // Optimistic update
    const tempId = Date.now().toString();
    const newItem: SessionItem = {
      id: tempId,
      label,
      checked: false
    };
    setSessionPlanItems(prev => [...prev, newItem]);
    toast.success("Custom drill added to plan");
    
    // Sync to database
    if (isSessionSynced && currentSessionId) {
      try {
        const response = await fetch('/api/sessions/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, xp_reward: 20 })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Replace temp ID with real database ID
          setSessionPlanItems(prev =>
            prev.map(i => i.id === tempId ? { ...i, id: data.item.id } : i)
          );
        }
      } catch (error) {
        console.error('Failed to sync new item:', error);
      }
    }
  };

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/sessions/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Training Session' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.session && data.items) {
          setCurrentSessionId(data.session.id);
          const dbItems: SessionItem[] = data.items.map((item: any) => ({
            id: item.id,
            label: item.label,
            checked: item.checked
          }));
          setSessionPlanItems(dbItems);
          setIsSessionSynced(true);
          toast.success("New session started!");
        }
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
      // Fallback to resetting local items
      setSessionPlanItems(SESSION_ITEMS.map(i => ({ ...i, checked: false })));
      toast.info("New session started (offline mode)");
    }
  };

  // Chat message management
  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const updateChatMessage = (id: string, text: string) => {
    setChatMessages(prev =>
      prev.map(msg => msg.id === id ? { ...msg, text: msg.text + text } : msg)
    );
  };

  const setChatTyping = (typing: boolean) => {
    setIsChatTyping(typing);
  };

  return (
    <UiContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        isSearchOpen,
        toggleSearch,
        notifications,
        clearNotifications,
        sessionStats,
        updateSessionStats,
        searchQuery,
        setSearchQuery,
        isLoadingStats,
        statsError,
        refetchStats: fetchStats,
        sessionPlanItems,
        toggleSessionItem,
        resetSessionPlan,
        addSessionItem,
        startNewSession,
        currentSessionId,
        isSessionSynced,
        chatMessages,
        addChatMessage,
        updateChatMessage,
        setChatTyping,
        isChatTyping,
      }}
    >
      {children}
      {user && (
        <WelcomeWizard 
          isOpen={onboardingOpen} 
          onClose={() => setOnboardingOpen(false)}
          userId={user.id} 
        />
      )}
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (context === undefined) {
    throw new Error("useUi must be used within a UiProvider");
  }
  return context;
}
