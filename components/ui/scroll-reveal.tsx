"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setHasAnimated(true);
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "50px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
        if (ref.current) {
            observer.unobserve(ref.current);
        }
    };
  }, [delay, hasAnimated]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        hasAnimated 
          ? "opacity-100 translate-y-0" 
          : "opacity-90 translate-y-2",
        className
      )}
    >
      {children}
    </div>
  );
}
