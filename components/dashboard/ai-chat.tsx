"use client";

import { Maximize2, Bot, SendHorizontal, Sparkles } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ChatMessage } from "@/lib/data";
import { useUi } from "@/components/providers/ui-provider";
import { useUser } from "@clerk/nextjs";

// Suggested prompts for quick interaction
const SUGGESTED_PROMPTS = [
  { label: "Analyze my form", emoji: "🎯" },
  { label: "Plan a workout", emoji: "📋" },
  { label: "Drill suggestions", emoji: "💡" }
];

export default function AiChat() {
  // Use global context for message persistence
  const {
    sessionStats,
    chatMessages,
    addChatMessage,
    updateChatMessage,
    isChatTyping,
    setChatTyping
  } = useUi();

  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(chatMessages.length > 0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const prevDrillCount = useRef(sessionStats.completedDrills);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.firstName || "Athlete";

  // Scroll within the chat container only
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [chatMessages, isChatTyping]);

  // React to drill completions
  useEffect(() => {
    if (sessionStats.completedDrills > prevDrillCount.current) {
      setChatTyping(true);
      setTimeout(() => {
        const praises = [
          `Great work finishing that drill, ${userName}! 🔥`,
          "Solid intensity. Keep that pace up.",
          "Drill complete! Your consistency is improving.",
          "Nice job! Ready for another challenge?"
        ];
        const msg = praises[Math.floor(Math.random() * praises.length)];

        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'bot',
          text: msg,
          timestamp: 'Just now'
        };
        addChatMessage(botMessage);
        setChatTyping(false);
        setHasInteracted(true);
      }, 1500);
    }
    prevDrillCount.current = sessionStats.completedDrills;
  }, [sessionStats.completedDrills, userName, addChatMessage, setChatTyping]);

  const handleSendMessage = async (e?: React.FormEvent, promptText?: string) => {
    if (e) e.preventDefault();
    const messageText = promptText || inputValue.trim();
    if (!messageText) return;

    setHasInteracted(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: 'Just now'
    };

    addChatMessage(userMsg);
    setInputValue("");
    setChatTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.text })),
          stats: sessionStats
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to AI Coach');
      }
      if (!response.body) return;

      const botMsgId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'bot',
        text: '',
        timestamp: 'Just now'
      };

      addChatMessage(botMsg);
      setChatTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });

        updateChatMessage(botMsgId, chunkValue);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setChatTyping(false);

      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        text: `⚠️ Coach Nova is offline: ${error.message || "Connection failed."}`,
        timestamp: 'Just now'
      };
      addChatMessage(errorMsg);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(undefined, prompt);
  };

  return (
    <ScrollReveal className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 flex flex-col shadow-sm relative overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 h-auto' : 'h-full'}`}>
      {isExpanded && <div className="fixed inset-0 bg-black/60 -z-10" onClick={() => setIsExpanded(false)} />}

      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Coach Nova</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">AI</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-zinc-50/50 dark:bg-transparent">

        {/* Welcome message when no interaction yet */}
        {!hasInteracted && chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-3 shadow-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              {getGreeting()}, {userName}! 👋
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 max-w-[200px]">
              I'm Nova, your AI coach. How can I help you train smarter today?
            </p>

            {/* Suggested prompt chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handlePromptClick(prompt.label)}
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  {prompt.emoji} {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'bot' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400' : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'}`}>
              {msg.role === 'bot' ? <Bot size={14} /> : <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">ME</span>}
            </div>
            <div className={`p-3 rounded-2xl shadow-sm max-w-[85%] leading-relaxed ${msg.role === 'bot'
                ? 'bg-zinc-200 dark:bg-zinc-800 rounded-tl-none border border-zinc-300 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300'
                : 'bg-indigo-600 text-white rounded-tr-none shadow-md'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isChatTyping && (
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex-shrink-0 flex items-center justify-center border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <Bot size={14} />
            </div>
            <div className="bg-zinc-200 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-zinc-300 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <div className="flex gap-1 h-full items-center">
                <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all"
            placeholder="Ask Coach Nova..."
          />
          <button type="submit" className="absolute right-2 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-500 dark:text-indigo-400 transition-colors disabled:opacity-50" disabled={!inputValue.trim()}>
            <SendHorizontal size={14} />
          </button>
        </form>
      </div>
    </ScrollReveal>
  );
}
