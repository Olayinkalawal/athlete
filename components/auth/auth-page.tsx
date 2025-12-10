"use client";

import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
    Activity, Zap, Target, User, Mail, Lock, ArrowRight, 
    Github, ShieldCheck, Cpu, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa6";
import { 
    SiNike, SiAdidas, SiUnderarmour, SiPuma, 
    SiReebok, SiNewbalance
} from "react-icons/si";

export default function AuthPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const router = useRouter();

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true);
    }, []);

    // Spotlight effect handler
    const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'signin') {
            if (!isSignInLoaded) return;
            handleSignIn();
        } else {
            if (!isSignUpLoaded) return;
            handleSignUp();
        }
    };

    const handleSignIn = async () => {
        if (!signIn) return;
        setIsLoading(true);
        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                toast.success("Welcome back!");
                router.push('/');
            }
        } catch (err: any) {
            toast.error(err.errors?.[0]?.message || "Sign in failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!signUp) return;
        setIsLoading(true);
        try {
            const result = await signUp.create({
                emailAddress: email,
                password,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' ')
            });
            if (result.status === 'complete') {
                await setSignUpActive({ session: result.createdSessionId });
                toast.success("Account created!");
                router.push('/');
            } else {
                toast.info("Please check your email to verify your account");
            }
        } catch (err: any) {
            toast.error(err.errors?.[0]?.message || "Sign up failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider: 'oauth_github' | 'oauth_google') => {
        if (!signIn) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: provider,
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/'
            });
        } catch (err: any) {
            toast.error("OAuth sign in failed");
        }
    };

    return (
        <div className="bg-black text-zinc-400 font-sans antialiased overflow-x-hidden min-h-screen relative selection:bg-indigo-500/30 selection:text-indigo-200">
            
            {/* Decorative Beam Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
                <svg className="absolute top-0 left-0 w-full h-full opacity-30" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                            <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M-100 200 C 100 200, 300 400, 600 400 C 900 400, 1000 200, 1500 300" stroke="#27272a" strokeWidth="1" fill="none" />
                    <path d="M-100 200 C 100 200, 300 400, 600 400 C 900 400, 1000 200, 1500 300" stroke="url(#beam-grad)" strokeWidth="1.5" fill="none" className="animate-beam" />
                    <path d="M 1200 -100 C 1200 200, 1000 400, 1200 900" stroke="#27272a" strokeWidth="1" fill="none" />
                    <path d="M 1200 -100 C 1200 200, 1000 400, 1200 900" stroke="url(#beam-grad)" strokeWidth="1.5" fill="none" className="animate-beam" style={{ animationDelay: '-2s', animationDuration: '8s' }} />
                    <circle cx="600" cy="400" r="2" fill="#3f3f46" />
                    <circle cx="1200" cy="900" r="2" fill="#3f3f46" />
                </svg>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-[2px]">
                <div className={`flex items-center gap-2 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="relative">
                        <div className="absolute inset-0 rounded bg-indigo-500/20 animate-ping z-0" />
                        <div className="h-6 w-6 bg-zinc-100 rounded relative z-10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            <Activity className="text-black" size={14} />
                        </div>
                    </div>
                    <span className="text-zinc-100 font-semibold tracking-tight text-sm">ATHLETE</span>
                </div>
                <div className={`flex items-center gap-4 text-xs font-medium transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <a href="#" className="text-zinc-400 hover:text-white transition-colors">Documentation</a>
                    <a href="#" className="text-zinc-400 hover:text-white transition-colors">Support</a>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col pt-24">
                <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-[1200px] mx-auto pb-32">
                    
                    {/* Toast Notification */}
                    <div className={`mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 shadow-xl backdrop-blur-md">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span>System operational. Secure connection established.</span>
                        </div>
                    </div>

                    <div className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        
                        {/* Left: Branding */}
                        <div className="hidden lg:flex flex-col gap-6 max-w-lg relative">
                            <div className="absolute -top-10 -left-10 w-[140%] h-[140%] -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" style={{ backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            
                            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
                                Master your craft with <span className="text-zinc-500">AI-driven</span> precision.
                            </h1>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
                                Join elite athletes using computer vision and biomechanics to optimize performance. Sign in to access your dashboard.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4 relative">
                                <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 w-8 h-[1px] bg-zinc-800" />
                                
                                <div className="spotlight-card p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm group" onMouseMove={handleMouseMove}>
                                    <Zap className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform duration-300" size={20} />
                                    <div className="text-xl font-semibold text-zinc-200">0.05s</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Reaction Time</div>
                                </div>
                                <div className="spotlight-card p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm group" onMouseMove={handleMouseMove}>
                                    <Target className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform duration-300" size={20} />
                                    <div className="text-xl font-semibold text-zinc-200">98%</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Accuracy</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Auth Card */}
                        <div className="w-full max-w-sm mx-auto">
                            <div className="spotlight-card relative bg-black/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl" onMouseMove={handleMouseMove}>
                                
                                {/* Header */}
                                <div className="text-center mb-8 space-y-2 relative z-10">
                                    <h2 className="text-xl font-semibold text-white tracking-tight">
                                        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                                    </h2>
                                    <p className="text-xs text-zinc-500">
                                        {mode === 'signin' ? 'Enter your credentials to access your account.' : 'Enter your details to get started.'}
                                    </p>
                                </div>

                                {/* Toggle Switch */}
                                <div className="flex p-1 bg-zinc-900/50 rounded-lg mb-6 border border-zinc-800 relative z-10">
                                    <div 
                                        className="absolute top-1 h-[calc(100%-8px)] bg-zinc-800 rounded-md shadow-sm transition-all duration-300 ease-out border border-zinc-700/50"
                                        style={{ 
                                            width: 'calc(50% - 4px)', 
                                            left: mode === 'signin' ? '4px' : 'calc(50%)'
                                        }}
                                    />
                                    <button 
                                        onClick={() => setMode('signin')}
                                        className={`flex-1 relative z-10 py-1.5 text-xs font-medium transition-colors text-center ${mode === 'signin' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Sign In
                                    </button>
                                    <button 
                                        onClick={() => setMode('signup')}
                                        className={`flex-1 relative z-10 py-1.5 text-xs font-medium transition-colors text-center ${mode === 'signup' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div id="clerk-captcha" />
                                    
                                    {mode === 'signup' && (
                                        <div className="space-y-1.5 animate-fadeIn">
                                            <label htmlFor="name" className="text-[11px] font-medium text-zinc-400">Full Name</label>
                                            <div className="relative group">
                                                <input 
                                                    type="text" 
                                                    id="name" 
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900 transition-all" 
                                                    placeholder="Alex Morgan"
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                    <User className="text-zinc-500" size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className="text-[11px] font-medium text-zinc-400">Email Address</label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900 transition-all" 
                                                placeholder="name@athlete.com"
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                <Mail className="text-zinc-500" size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="text-[11px] font-medium text-zinc-400">Password</label>
                                            {mode === 'signin' && (
                                                <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <input 
                                                type="password" 
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900 transition-all" 
                                                placeholder="••••••••"
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                <Lock className="text-zinc-500" size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    {mode === 'signin' && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <input 
                                                type="checkbox" 
                                                id="remember" 
                                                className="h-3.5 w-3.5 rounded border border-zinc-700 bg-zinc-900 checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer accent-indigo-500"
                                            />
                                            <label htmlFor="remember" className="text-[11px] text-zinc-500 select-none cursor-pointer">Remember for 30 days</label>
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
                                    >
                                        <span>{isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}</span>
                                        {!isLoading && <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={14} />}
                                    </button>
                                </form>

                                <div className="relative my-6 z-10">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                                        <span className="bg-black px-2 text-zinc-600">Or continue with</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <button 
                                        onClick={() => handleOAuthSignIn('oauth_github')}
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition-all"
                                    >
                                        <Github size={14} />
                                        <span className="text-xs font-medium">GitHub</span>
                                    </button>
                                    <button 
                                        onClick={() => handleOAuthSignIn('oauth_google')}
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 hover:text-white transition-all"
                                    >
                                        <FaGoogle className="text-blue-400" size={14} />
                                        <span className="text-xs font-medium">Google</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Marquee Section */}
                    <div className={`w-full mt-24 mb-10 overflow-hidden relative transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-black to-transparent pointer-events-none" />
                        
                        <div className="flex w-full" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                            <div className="flex animate-marquee w-max gap-16 items-center">
                                {/* First set of logos */}
                                <div className="flex gap-16 items-center opacity-40 hover:opacity-80 transition-all duration-500">
                                    <SiNike className="h-8 w-auto text-white" />
                                    <SiAdidas className="h-8 w-auto text-white" />
                                    <SiUnderarmour className="h-6 w-auto text-white" />
                                    <SiPuma className="h-6 w-auto text-white" />
                                    <SiReebok className="h-6 w-auto text-white" />
                                    <SiNewbalance className="h-6 w-auto text-white" />
                                </div>
                                {/* Duplicate for seamless loop */}
                                <div className="flex gap-16 items-center opacity-40 hover:opacity-80 transition-all duration-500">
                                    <SiNike className="h-8 w-auto text-white" />
                                    <SiAdidas className="h-8 w-auto text-white" />
                                    <SiUnderarmour className="h-6 w-auto text-white" />
                                    <SiPuma className="h-6 w-auto text-white" />
                                    <SiReebok className="h-6 w-auto text-white" />
                                    <SiNewbalance className="h-6 w-auto text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className={`w-full mt-12 border-t border-zinc-900 pt-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="text-center mb-16 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Trust the process</h3>
                            <h2 className="text-2xl md:text-3xl font-semibold text-white">Built for High Performance</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="spotlight-card group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/10 transition-all" onMouseMove={handleMouseMove}>
                                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="text-zinc-400 group-hover:text-white" size={20} />
                                </div>
                                <h4 className="text-sm font-medium text-white mb-2">Bank-Grade Security</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Your biometric data is encrypted end-to-end using AES-256 protocols.</p>
                            </div>
                            <div className="spotlight-card group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/10 transition-all" onMouseMove={handleMouseMove}>
                                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Cpu className="text-zinc-400 group-hover:text-white" size={20} />
                                </div>
                                <h4 className="text-sm font-medium text-white mb-2">Real-time Processing</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Latency under 50ms ensures your training feedback is instant.</p>
                            </div>
                            <div className="spotlight-card group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/10 transition-all" onMouseMove={handleMouseMove}>
                                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Smartphone className="text-zinc-400 group-hover:text-white" size={20} />
                                </div>
                                <h4 className="text-sm font-medium text-white mb-2">Multi-Device Sync</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Start on mobile, review on desktop. Seamless continuity.</p>
                            </div>
                        </div>

                        <footer className="mt-20 py-8 text-center border-t border-zinc-900">
                            <p className="text-[10px] text-zinc-600">© 2024 Athlete AI Inc. All rights reserved.</p>
                        </footer>
                    </div>
                </main>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                .spotlight-card {
                    position: relative;
                    background-color: rgba(24, 24, 27, 0.4);
                    overflow: hidden;
                }
                .spotlight-card::before {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(
                        600px circle at var(--mouse-x) var(--mouse-y),
                        rgba(255, 255, 255, 0.06),
                        transparent 40%
                    );
                    pointer-events: none;
                    z-index: 1;
                }
                .spotlight-card::after {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    border-radius: inherit;
                    padding: 1px;
                    background: radial-gradient(
                        400px circle at var(--mouse-x) var(--mouse-y),
                        rgba(255, 255, 255, 0.4),
                        transparent 40%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    z-index: 2;
                    pointer-events: none;
                }
                @keyframes beam-move {
                    0% { stroke-dashoffset: 1000; }
                    100% { stroke-dashoffset: 0; }
                }
                .animate-beam {
                    stroke-dasharray: 10 200;
                    animation: beam-move 6s linear infinite;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out both;
                }
                @keyframes marquee-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee-scroll 40s linear infinite;
                }
            `}</style>
        </div>
    );
}
