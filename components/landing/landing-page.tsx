"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
    Activity, Zap, Target, ArrowRight, ChevronRight,
    Shield, Cpu, Smartphone, Play, Star, Users, TrendingUp
} from "lucide-react";
import { 
    SiNike, SiAdidas, SiUnderarmour, SiPuma, 
    SiReebok, SiNewbalance
} from "react-icons/si";

// Custom hook for intersection observer
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated Section Component
function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView(0.1);
  
  return (
    <div
      ref={ref}
      className={`${className}`}
      style={{
        animation: isInView 
          ? `fadeSlideBlurIn 0.8s ease-out ${delay}ms both` 
          : 'none',
        opacity: isInView ? undefined : 0.01,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for flashlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Parallax scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { value: "10K+", label: "Active Athletes", icon: Users },
    { value: "98%", label: "Accuracy Rate", icon: Target },
    { value: "2.5M", label: "Drills Completed", icon: TrendingUp },
  ];

  const features = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your biometric data is encrypted end-to-end using AES-256 protocols.",
    },
    {
      icon: Cpu,
      title: "Real-time AI Analysis",
      description: "Computer vision processes your form with latency under 50ms.",
    },
    {
      icon: Smartphone,
      title: "Multi-Device Sync",
      description: "Start on mobile, review on desktop. Seamless continuity everywhere.",
    },
  ];

  const testimonials = [
    { name: "Marcus J.", role: "Pro Basketball", quote: "My shooting accuracy improved 23% in just 3 weeks." },
    { name: "Sofia R.", role: "Olympic Swimmer", quote: "The AI coach catches technique flaws my human coach misses." },
    { name: "David K.", role: "MMA Fighter", quote: "Game-changing insights that leveled up my entire training." },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Fixed Background Video - Stays in place while content scrolls */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text readability across entire page */}
      <div className="fixed inset-0 bg-black/40 z-[1]" />

      {/* Gradient overlay for better text visibility */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-[2]" />

      {/* Global Flashlight Effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.04), transparent 40%)`,
        }}
      />

      {/* Parallax Background with Beams */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Animated Beam Lines (Noodles) */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="beam-gradient-v" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Beams */}
          <path 
            d="M-100 200 Q 300 250, 600 200 T 1400 250" 
            stroke="#1e1e2e" 
            strokeWidth="1" 
            fill="none"
          />
          <path 
            d="M-100 200 Q 300 250, 600 200 T 1400 250" 
            stroke="url(#beam-gradient)" 
            strokeWidth="2" 
            fill="none"
            className="animate-beam"
          />
          
          <path 
            d="M-100 600 Q 400 550, 800 600 T 1500 550" 
            stroke="#1e1e2e" 
            strokeWidth="1" 
            fill="none"
          />
          <path 
            d="M-100 600 Q 400 550, 800 600 T 1500 550" 
            stroke="url(#beam-gradient)" 
            strokeWidth="2" 
            fill="none"
            className="animate-beam"
            style={{ animationDelay: '-3s' }}
          />
          
          {/* Vertical Beam */}
          <path 
            d="M 1100 -100 Q 1050 400, 1100 900" 
            stroke="#1e1e2e" 
            strokeWidth="1" 
            fill="none"
          />
          <path 
            d="M 1100 -100 Q 1050 400, 1100 900" 
            stroke="url(#beam-gradient-v)" 
            strokeWidth="2" 
            fill="none"
            className="animate-beam-vertical"
          />
        </svg>

        {/* Sonar Decorations */}
        <div className="absolute top-1/4 left-1/4 animate-sonar">
          <div className="w-4 h-4 bg-indigo-500/20 rounded-full" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-sonar" style={{ animationDelay: '-2s' }}>
          <div className="w-3 h-3 bg-emerald-500/20 rounded-full" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-sonar" style={{ animationDelay: '-4s' }}>
          <div className="w-2 h-2 bg-purple-500/20 rounded-full" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-5 backdrop-blur-md bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 animate-clip-in">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-lg animate-ping opacity-75" />
              <div className="relative h-9 w-9 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
                <Activity className="text-black" size={18} />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">ATHLETE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Athletes</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/sign-up" className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-all shadow-lg shadow-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs mb-8 animate-clip-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-zinc-400">Now with GPT-4 Vision Integration</span>
            <ChevronRight size={14} className="text-zinc-500" />
          </div>

          {/* Main Headline with Clip Animation */}
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95] animate-clip-in"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="text-white">Train Smarter.</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Perform Better.
            </span>
          </h1>

          <p 
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 animate-clip-in"
            style={{ animationDelay: '0.2s' }}
          >
            AI-powered biomechanics analysis and personalized training plans. 
            Join elite athletes using computer vision to optimize every movement.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-clip-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Link href="/sign-up" className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105">
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
            <button className="flex items-center gap-3 px-6 py-4 text-zinc-400 hover:text-white transition-colors group">
              <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-white/50 group-hover:bg-white/5 transition-all">
                <Play size={16} fill="currentColor" />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Stats Row */}
          <div 
            className="flex flex-wrap justify-center gap-8 md:gap-16 animate-clip-in"
            style={{ animationDelay: '0.4s' }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-3xl md:text-4xl font-bold text-white">{stat.value}</span>
                </div>
                <span className="text-sm text-zinc-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-zinc-500 rounded-full animate-scroll-indicator" />
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 border-y border-zinc-900 overflow-hidden">
        <div 
          className="flex"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex animate-marquee gap-24 items-center">
            {/* First set */}
            <span className="text-zinc-600 text-sm font-medium whitespace-nowrap">TRUSTED BY ELITE TEAMS</span>
            <SiNike className="h-8 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiAdidas className="h-8 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiUnderarmour className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiPuma className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiReebok className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiNewbalance className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            {/* Duplicate for seamless loop */}
            <span className="text-zinc-600 text-sm font-medium whitespace-nowrap">TRUSTED BY ELITE TEAMS</span>
            <SiNike className="h-8 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiAdidas className="h-8 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiUnderarmour className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiPuma className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiReebok className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
            <SiNewbalance className="h-6 w-auto text-zinc-600 hover:text-white transition-colors" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <span className="text-indigo-400 text-sm font-medium uppercase tracking-widest mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for High Performance</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Every feature is designed to give you an unfair advantage in your training.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div 
                  className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 overflow-hidden spotlight-card"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                  }}
                >
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-300">
                      <feature.icon size={24} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-4 block">Athletes</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Loved by Champions</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div 
                  className="relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-all spotlight-card"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                  }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-sm text-zinc-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative z-10">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 md:p-20 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Level Up?</h2>
              <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
                Join thousands of athletes who are already training smarter with AI-powered insights.
              </p>
              <Link href="/sign-up" className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all shadow-2xl shadow-white/20 hover:scale-105">
                Get Started Free
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-zinc-500" />
            <span className="text-zinc-500 font-medium">ATHLETE</span>
          </div>
          <p className="text-zinc-600 text-sm">© 2024 Athlete AI Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        /* Clip-in intro animation */
        @keyframes clipIn {
          0% {
            clip-path: inset(100% 0 0 0);
            transform: translateY(20px);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translateY(0);
          }
        }
        .animate-clip-in {
          animation: clipIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Fade, slide, blur in animation */
        @keyframes fadeSlideBlurIn {
          0% {
            opacity: 0.01;
            transform: translateY(30px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Beam animation */
        @keyframes beamMove {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-beam {
          stroke-dasharray: 20 300;
          animation: beamMove 8s linear infinite;
        }
        .animate-beam-vertical {
          stroke-dasharray: 15 400;
          animation: beamMove 10s linear infinite reverse;
        }

        /* Sonar animation */
        @keyframes sonar {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        .animate-sonar::after {
          content: '';
          position: absolute;
          inset: -10px;
          border: 2px solid currentColor;
          border-radius: 50%;
          animation: sonar 3s ease-out infinite;
        }
        .animate-sonar::before {
          content: '';
          position: absolute;
          inset: -10px;
          border: 2px solid currentColor;
          border-radius: 50%;
          animation: sonar 3s ease-out infinite 1.5s;
        }

        /* Scroll indicator */
        @keyframes scrollIndicator {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(4px); opacity: 0.5; }
        }
        .animate-scroll-indicator {
          animation: scrollIndicator 1.5s ease-in-out infinite;
        }

        /* Marquee */
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        /* Spotlight card effect */
        .spotlight-card {
          position: relative;
        }
        .spotlight-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(99, 102, 241, 0.1),
            transparent 40%
          );
          pointer-events: none;
          border-radius: inherit;
          z-index: 0;
        }
        .spotlight-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: radial-gradient(
            400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.3),
            transparent 40%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
