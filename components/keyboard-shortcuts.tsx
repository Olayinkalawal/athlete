"use client";

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export function KeyboardShortcuts() {
  // This hook sets up global keyboard event listeners
  useKeyboardShortcuts();
  
  // This component doesn't render anything visible
  return null;
}
