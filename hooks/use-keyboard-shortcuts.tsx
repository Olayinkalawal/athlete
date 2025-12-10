"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/theme-provider';
import { toast } from 'sonner';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { toggleTheme } = useTheme();

  // Define all shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation shortcuts (use 'g' prefix like GitHub)
    { key: 'h', ctrl: false, meta: false, description: 'Go to Home', action: () => router.push('/') },
    { key: 'p', ctrl: false, meta: false, description: 'Go to Progress', action: () => router.push('/progress') },
    { key: 's', ctrl: false, meta: false, description: 'Go to Settings', action: () => router.push('/settings') },
    { key: 'a', ctrl: false, meta: false, description: 'Go to AI Coach', action: () => router.push('/ai-coach') },
    
    // Discipline shortcuts (1-6 for different disciplines)
    { key: '1', ctrl: false, meta: false, description: 'Go to Football', action: () => router.push('/disciplines/football') },
    { key: '2', ctrl: false, meta: false, description: 'Go to Basketball', action: () => router.push('/disciplines/basketball') },
    { key: '3', ctrl: false, meta: false, description: 'Go to Tennis', action: () => router.push('/disciplines/tennis') },
    { key: '4', ctrl: false, meta: false, description: 'Go to Swimming', action: () => router.push('/disciplines/swimming') },
    { key: '5', ctrl: false, meta: false, description: 'Go to Running', action: () => router.push('/disciplines/running') },
    { key: '6', ctrl: false, meta: false, description: 'Go to Golf', action: () => router.push('/disciplines/golf') },
    
    // Actions
    { key: 't', ctrl: false, meta: false, description: 'Toggle Theme', action: () => toggleTheme() },
    { key: '?', shift: true, ctrl: false, meta: false, description: 'Show Shortcuts', action: () => showShortcutsHelp() },
  ];

  const showShortcutsHelp = useCallback(() => {
    toast.info(
      <div className="space-y-1 text-xs">
        <div className="font-semibold mb-2">⌨️ Keyboard Shortcuts</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-zinc-400">h</span><span>Home</span>
          <span className="text-zinc-400">p</span><span>Progress</span>
          <span className="text-zinc-400">s</span><span>Settings</span>
          <span className="text-zinc-400">a</span><span>AI Coach</span>
          <span className="text-zinc-400">1-6</span><span>Disciplines</span>
          <span className="text-zinc-400">t</span><span>Toggle Theme</span>
          <span className="text-zinc-400">⌘K</span><span>Search</span>
          <span className="text-zinc-400">?</span><span>Show Help</span>
        </div>
      </div>,
      { duration: 5000 }
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() || 
                        (shortcut.shift && e.key === shortcut.key);
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey || e.key === shortcut.key;
        
        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { showShortcutsHelp };
}
