"use client";

import React, { useState, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { Activity, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { toast } from "sonner";

type AuthMode = "signin" | "signup";
type AuthStep = "initial" | "verify-email";

export default function CustomAuthPage() {
  const { signIn, setActive: setActiveSignIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  const pathname = usePathname();

  // Detect mode from pathname - this is the critical fix
  const [mode, setMode] = useState<AuthMode>(
    pathname?.includes('sign-up') ? 'signup' : 'signin'
  );
  const [step, setStep] = useState<AuthStep>("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Update mode when pathname changes (when user toggles between sign-in/sign-up)
  useEffect(() => {
    const newMode = pathname?.includes('sign-up') ? 'signup' : 'signin';
    if (newMode !== mode) {
      setMode(newMode);
      setStep("initial"); // Reset to initial step when switching modes
    }
  }, [pathname, mode]);

  // Mouse tracking for flashlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle email/password sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
        router.push("/");
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      toast.error(err.errors?.[0]?.longMessage || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email/password sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify-email");
      toast.success("Check your email for verification code");
    } catch (err: any) {
      console.error("Sign up error:", err);
      toast.error(err.errors?.[0]?.longMessage || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        router.push("/");
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.errors?.[0]?.longMessage || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: "oauth_google" | "oauth_github" | "oauth_apple") => {
    if (!isSignInLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      toast.error("Failed to connect with provider");
    }
  };

  const isLoaded = isSignInLoaded && isSignUpLoaded;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Flashlight Effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.06), transparent 40%)`,
        }}
      />

      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Animated Beam */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <defs>
            <linearGradient id="auth-beam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path 
            d="M-100 300 Q 400 250, 800 300 T 1600 250" 
            stroke="url(#auth-beam)" 
            strokeWidth="2" 
            fill="none"
            className="animate-beam"
          />
        </svg>
      </div>

      {/* Auth Card */}
      <div 
        className="relative z-10 w-full max-w-md"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        }}
      >
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl overflow-hidden spotlight-card">
          
          {/* Card Flashlight Effect */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.1), transparent 40%)',
            }}
          />
          
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fadeIn">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 rounded-xl animate-ping opacity-50" style={{ animationDuration: '2s' }} />
              <div className="relative h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
                <Activity className="text-black" size={24} />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">ATHLETE</span>
          </div>

          {step === "initial" ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-zinc-400 text-sm">
                  {mode === "signin" 
                    ? "Sign in to continue your training journey" 
                    : "Start your AI-powered training experience"}
                </p>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_google")}
                  disabled={!isLoaded}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all group"
                >
                  <FaGoogle className="text-lg group-hover:scale-110 transition-transform" />
                  Continue with Google
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn("oauth_github")}
                    disabled={!isLoaded}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all group"
                  >
                    <FaGithub className="text-lg group-hover:scale-110 transition-transform" />
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn("oauth_apple")}
                    disabled={!isLoaded}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all group"
                  >
                    <FaApple className="text-lg group-hover:scale-110 transition-transform" />
                    Apple
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-zinc-900 text-zinc-500">or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your name"
                        className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder:text-zinc-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder:text-zinc-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-white text-sm placeholder:text-zinc-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl shadow-lg shadow-white/10 hover:shadow-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {mode === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Mode */}
              <p className="text-center text-sm text-zinc-400 mt-6">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="ml-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          ) : (
            /* Email Verification Step */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                <p className="text-zinc-400 text-sm">
                  We sent a verification code to <br />
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-white text-sm text-center tracking-[0.5em] font-mono placeholder:tracking-normal transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={18} />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep("initial")}
                className="w-full text-center text-sm text-zinc-400 hover:text-white mt-4 transition-colors"
              >
                ← Back to sign up
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Terms</a>
          {" "}and{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</a>
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out both;
        }
        
        @keyframes beam {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-beam {
          stroke-dasharray: 20 300;
          animation: beam 8s linear infinite;
        }
        
        .spotlight-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: radial-gradient(
            400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.15),
            transparent 40%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
