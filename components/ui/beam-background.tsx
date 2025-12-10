"use client";

import React from "react";

export function BeamBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none dark:opacity-100 opacity-0 transition-opacity duration-500">
            <svg 
                className="absolute top-0 left-0 w-full h-full opacity-30" 
                viewBox="0 0 1440 900" 
                fill="none" 
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Noodle 1: Left to Center */}
                <path 
                    d="M-100 200 C 100 200, 300 400, 600 400 C 900 400, 1000 200, 1500 300" 
                    stroke="#27272a" 
                    strokeWidth="1" 
                    fill="none" 
                />
                <path 
                    d="M-100 200 C 100 200, 300 400, 600 400 C 900 400, 1000 200, 1500 300" 
                    stroke="url(#beam-grad)" 
                    strokeWidth="1.5" 
                    fill="none" 
                    className="animate-beam" 
                />
                {/* Noodle 2: Vertical connection */}
                <path 
                    d="M 1200 -100 C 1200 200, 1000 400, 1200 900" 
                    stroke="#27272a" 
                    strokeWidth="1" 
                    fill="none" 
                />
                <path 
                    d="M 1200 -100 C 1200 200, 1000 400, 1200 900" 
                    stroke="url(#beam-grad)" 
                    strokeWidth="1.5" 
                    fill="none" 
                    className="animate-beam" 
                    style={{ animationDelay: '-2s', animationDuration: '8s' }} 
                />
                {/* Dots Decoration */}
                <circle cx="600" cy="400" r="2" fill="#3f3f46" />
                <circle cx="1200" cy="900" r="2" fill="#3f3f46" />
            </svg>
        </div>
    );
}
