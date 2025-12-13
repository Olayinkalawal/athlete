"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Profile page redirects to Settings where profile info is displayed
export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/settings");
    }, [router]);

    return (
        <main className="flex-1 flex items-center justify-center h-full bg-zinc-50 dark:bg-black">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">Redirecting to profile settings...</p>
            </div>
        </main>
    );
}
