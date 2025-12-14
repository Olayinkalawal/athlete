"use client";

import { Menu, Search, Users, Bell, LogOut, Settings, User, Sun, Moon, Loader2, HelpCircle } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { DRILLS } from "@/lib/data";
import { useUi } from "@/components/providers/ui-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { toast } from "sonner";
import { useClerk, useUser } from "@clerk/nextjs";
import { StartTourButton } from "@/components/guide-tour";

export default function Header() {
  const { toggleSidebar, setSearchQuery, notifications, clearNotifications } = useUi();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowNotifMenu(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setSearchQuery(val);
    setShowResults(val.length > 0);
  };

  const filteredItems = DRILLS.filter(d =>
    d.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <header ref={headerRef} className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800"
        >
          <Menu className="text-xl" size={20} />
        </button>
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">ATHLETE</span>
      </div>

      {/* Context Breadcrumb / Title */}
      <div className="hidden md:flex items-center gap-2 text-xs">
        <span className="text-zinc-400 dark:text-zinc-500">
          {pathname === '/' ? 'Dashboard' :
            pathname.startsWith('/disciplines') ? 'Training' :
              pathname.startsWith('/progress') ? 'Stats' :
                pathname.startsWith('/ai-coach') ? 'AI' :
                  pathname.startsWith('/settings') ? 'Account' :
                    pathname.startsWith('/profile') ? 'Account' :
                      'App'}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-zinc-700 dark:text-zinc-200 font-medium">
          {pathname === '/' ? 'Overview' :
            pathname.startsWith('/disciplines/football') ? 'Football' :
              pathname.startsWith('/disciplines/basketball') ? 'Basketball' :
                pathname.startsWith('/disciplines/boxing') ? 'Boxing' :
                  pathname.startsWith('/disciplines/mma') ? 'MMA' :
                    pathname.startsWith('/disciplines/taekwondo') ? 'Taekwondo' :
                      pathname.startsWith('/disciplines/american-football') ? 'American Football' :
                        pathname.startsWith('/disciplines') ? 'Disciplines' :
                          pathname.startsWith('/progress') ? 'Progress' :
                            pathname.startsWith('/ai-coach') ? 'Coach Nova' :
                              pathname.startsWith('/settings') ? 'Settings' :
                                pathname.startsWith('/profile') ? 'Profile' :
                                  'Page'}
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto px-4 hidden md:block group relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-zinc-400 dark:text-zinc-600 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={16} strokeWidth={1.5} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={handleSearch}
            className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all focus:bg-white dark:focus:bg-zinc-900"
            placeholder="Search drills, history, or ask AI..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center h-4 border border-zinc-300 dark:border-zinc-700 rounded px-1 text-[9px] font-sans text-zinc-400 dark:text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/50">⌘K</kbd>
          </div>
        </div>

        {/* Search Dropdown */}
        {showResults && searchValue && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <button
                  key={item.title}
                  onClick={() => { setShowResults(false); setSearchValue(''); }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-900/50 last:border-0 flex items-center gap-3"
                >
                  <div className="h-8 w-8 relative rounded overflow-hidden">
                    <Image src={item.image} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{item.title}</p>
                    <p className="text-[10px] text-zinc-500">{item.category}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-zinc-500">No drills found.</div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Theme Toggle */}
        <button
          onClick={() => toggleTheme()}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-all active:scale-95"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>

        {/* Guide Tour Button */}
        <StartTourButton variant="icon" />

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block"></div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95"
          >
            <Bell size={20} strokeWidth={1.5} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1.5 h-1.5 w-1.5 bg-indigo-500 rounded-full border border-white dark:border-black"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications > 0 ? (
                  <div className="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">You have new activity in your training.</p>
                    <p className="text-[10px] text-zinc-500">Just now</p>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <Bell size={24} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">No new notifications</p>
                  </div>
                )}
              </div>
              {notifications > 0 && (
                <button
                  onClick={() => { clearNotifications(); setShowNotifMenu(false); }}
                  className="w-full py-1.5 text-[10px] text-center text-blue-500 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="md:hidden lg:block relative h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden active:scale-95 transition-transform"
          >
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                <User size={16} className="text-zinc-500" />
              </div>
            )}
          </button>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="hidden md:block lg:hidden relative h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden active:scale-95 transition-transform"
          >
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                <User size={16} className="text-zinc-500" />
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2"
              >
                <User size={14} /> Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2"
              >
                <Settings size={14} /> Settings
              </Link>
              <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1"></div>
              <button
                onClick={async () => {
                  setShowProfileMenu(false);
                  // Hide UI immediately before sign-out completes
                  document.body.style.opacity = '0';
                  await signOut(() => {
                    // Force full page reload to ensure Clerk state is cleared
                    window.location.href = '/landing';
                  });
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
