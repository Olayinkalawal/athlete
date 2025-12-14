"use client";

import {
    PanelLeftClose,
    Plus,
    MoreHorizontal,
    ChevronRight,
    User
} from "lucide-react";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAVIGATION_ITEMS, DISCIPLINES } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useUi } from "@/components/providers/ui-provider";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function Sidebar() {
    const { isSidebarOpen, closeSidebar, startNewSession, updateSessionStats } = useUi();
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();

    const handleMobileClose = () => {
        if (window.innerWidth < 768) {
            closeSidebar();
        }
    };

    const handleNewSession = async () => {
        // Use the new database-synced function
        await startNewSession();

        // Award XP for starting a new session
        updateSessionStats({
            totalSessions: 1,
            totalXp: 10 // Bonus XP for starting a session
        });

        toast.success("New training session started! 🏆", {
            description: "+10 XP • Your session plan has been reset. Let's train!"
        });

        // Navigate to home if not already there
        if (pathname !== "/") {
            router.push("/");
        }
        handleMobileClose();
    };

    const handleAction = (action: string) => {
        toast.info(action);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside className={cn(
                "flex flex-col w-64 border-r h-full flex-shrink-0 z-50 transition-all duration-300 ease-in-out",
                "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                "fixed inset-y-0 left-0 md:relative md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 flex flex-col h-full justify-between">
                    <div>
                        {/* Logo area */}
                        <div className="flex items-center justify-between px-2 mb-6 mt-1">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-black text-[10px] font-bold tracking-tighter shadow-lg">AT</div>
                                <span className="text-zinc-900 dark:text-zinc-100 font-semibold tracking-tight text-sm">ATHLETE</span>
                            </Link>
                            <button
                                onClick={closeSidebar}
                                className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors md:hidden"
                            >
                                <PanelLeftClose size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Primary Actions */}
                        <div className="px-2 mb-6">
                            <button
                                onClick={handleNewSession}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 rounded-md shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Plus size={16} strokeWidth={2} />
                                New Session
                            </button>
                        </div>

                        {/* Main Nav */}
                        <nav className="space-y-1 mb-8">
                            <p className="px-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-600 mb-2 uppercase tracking-wider">Dashboard</p>
                            {NAVIGATION_ITEMS.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={handleMobileClose}
                                        className={cn(
                                            "flex items-center gap-3 px-2 py-1.5 rounded-md transition-all group cursor-pointer",
                                            isActive
                                                ? "bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800/50"
                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(isActive ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")}
                                            size={16}
                                            strokeWidth={1.5}
                                        />
                                        <span className={cn("text-xs font-medium", isActive ? "text-zinc-900 dark:text-zinc-100" : "")}>{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">{item.badge}</span>
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Disciplines List */}
                        <nav className="space-y-1">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Discipline</p>
                                <button
                                    onClick={() => handleAction("Discipline Options")}
                                    className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>

                            {DISCIPLINES.filter(d => !d.hiddenOnMobile).map((discipline) => {
                                const isActiveDiscipline = pathname === `/disciplines/${discipline.slug}`;
                                return (
                                    <Link
                                        key={discipline.name}
                                        href={`/disciplines/${discipline.slug}`}
                                        onClick={handleMobileClose}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-all group",
                                            isActiveDiscipline
                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50 shadow-sm justify-between"
                                                : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-6 w-6 rounded-md ${discipline.bgClass} flex items-center justify-center`}>
                                                <discipline.Icon className={`${discipline.colorClass}`} size={12} />
                                            </div>
                                            <span className="text-xs font-medium">{discipline.name}</span>
                                        </div>
                                        {isActiveDiscipline && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Profile Footer */}
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                        <Link
                            href="/profile"
                            onClick={handleMobileClose}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
                        >
                            <div className="relative h-8 w-8">
                                <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 overflow-hidden relative">
                                    {user?.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt={user.fullName || "Profile"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User size={16} className="text-zinc-500" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-white dark:bg-black rounded-full flex items-center justify-center z-10">
                                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">{user?.fullName || 'Athlete'}</span>
                                <span className="text-[10px] text-zinc-500">Free Plan</span>
                            </div>
                            <ChevronRight className="text-zinc-400 dark:text-zinc-600 ml-auto group-hover:text-zinc-600 dark:group-hover:text-zinc-400" size={16} strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
