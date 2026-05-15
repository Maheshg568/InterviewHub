import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  ArrowRight,
  RefreshCcw,
  Sparkles,
  CircuitBoard,
  BadgeInfo
} from "lucide-react";
import { socraticChat } from "../api";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

export default function SocraticSession() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [directAnswerBlocked, setDirectAnswerBlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const demoProblems = [
    { topic: "Algebra - Linear Equations", problem: "Solve 2x + 5 = 15 through balanced logic." },
    { topic: "Fractions - Logic", problem: "Why is 1/2 + 1/4 not 2/6? Explain the contradiction." },
    { topic: "Geometry - Pythagoras", problem: "What makes a 3-4-5 triangle unique in terms of its angles?" }
  ];

  const current = demoProblems[currentProblemIndex];

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: `Neural handshake successful. Objective: **"${current.problem}"**. \n\nBefore I guide you, tell me: if we view this as a balancing act, what would be your first move to simplify the arrangement?` }
    ]);
    setDirectAnswerBlocked(false);
  }, [currentProblemIndex]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    // Check if user is asking for direct answer (simple heuristic)
    const directAnswerTriggers = ["give me the answer", "what is the answer", "direct answer", "just tell me"];
    if (directAnswerTriggers.some(t => input.toLowerCase().includes(t))) {
      setDirectAnswerBlocked(true);
      setTimeout(() => setDirectAnswerBlocked(false), 4000);
    }

    const userMsg = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

        try {
        const resp = await socraticChat("S001", current.topic, currentInput);
        const reply = resp?.data?.reply || resp?.data || "Logic loop detected. Recalibrating... how else can we view this?";
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
        console.error("AI Error:", e);
        setMessages(prev => [...prev, { role: 'assistant', content: "Neural bypass failed. Re-state your reasoning." }]);
    } finally {
        setLoading(false);
    }
  };

  const nextProblem = () => {
    setCurrentProblemIndex((prev) => (prev + 1) % demoProblems.length);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#E0F2FE] border border-white/70 rounded-[3rem] shadow-4xl relative overflow-hidden backdrop-blur-3xl animate-in fade-in duration-700">
      {/* Background Pulse */}
      <div className="absolute top-0 right-0 w-full h-[50%] bg-gradient-to-b from-indigo-600/[0.03] to-transparent pointer-events-none -z-10" />

      {/* Header Segment */}
      <div className="p-8 md:p-10 border-b border-white/70 flex items-center justify-between bg-white/75 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#121826] rounded-3xl border border-white/70 flex items-center justify-center shadow-2xl relative">
               <CircuitBoard className="w-8 h-8 text-indigo-400 group-hover:rotate-12 transition-transform" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-obsidian animate-pulse shadow-glow shadow-emerald-500/50" />
            </div>
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                 <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">Socratic Mentor</h3>
                 <span className="status-label text-indigo-400 py-1 px-3 bg-indigo-500/5 rounded-full border border-indigo-500/10">Active Reasoning</span>
               </div>
               <p className="status-label text-slate-500 !tracking-[0.15em]">{current.topic}</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
            <AnimatePresence>
               {directAnswerBlocked && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500"
                 >
                    <BadgeInfo className="w-4 h-4" />
                    <span className="status-label !text-[8px]">Direct Answer Blocked</span>
                 </motion.div>
               )}
            </AnimatePresence>
            <button 
              onClick={nextProblem}
              className="w-14 h-14 bg-white/5 border border-white/70 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all group shadow-xl"
              title="Recalibrate / Next"
            >
              <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            </button>
         </div>
      </div>

      {/* Immersive Message Thread */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 md:p-16 space-y-16 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-center'} w-full text-center`}
            >
              <div className={`max-w-[800px] w-full px-6 py-10 rounded-[3rem] transition-all ${
                m.role === 'assistant' 
                  ? 'bg-transparent text-slate-700' 
                  : 'bg-white/75 text-white border border-white/70 shadow-2xl relative'
              }`}>
                {m.role === 'user' && (
                  <div className="status-label text-indigo-400 mb-6 !tracking-widest">Logic Input</div>
                )}
                {m.role === 'assistant' && (
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/50">
                     <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "markdown-content",
                  m.role === 'assistant' ? "text-2xl font-medium tracking-tight leading-relaxed italic" : "text-lg md:text-xl font-bold tracking-tight opacity-70"
                )}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          
          {loading && (
             <div className="w-full flex justify-center py-4">
                <div className="flex gap-2 p-5 bg-white/75 rounded-[1.5rem] border border-white/70 items-center">
                   <div className="flex gap-1">
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                   </div>
                   <span className="status-label text-slate-500">Evaluating Logic Flow</span>
                </div>
             </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Concentrated Input Area */}
      <div className="p-10 md:p-14 bg-gradient-to-t from-black/50 to-transparent relative z-10">
          <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Articulate your thought process here..."
                  className="w-full bg-[#111827] border border-white/70 rounded-[2rem] pl-10 pr-20 py-8 text-xl font-bold text-white placeholder:text-white/5 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner relative z-10"
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-5 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-20 z-20 group-hover:scale-105 active:scale-95"
              >
                  <ArrowRight className="w-6 h-6" />
              </button>
          </div>
          <motion.div 
             animate={{ opacity: [0.1, 0.3, 0.1] }}
             transition={{ repeat: Infinity, duration: 4 }}
             className="text-center mt-8 status-label !tracking-[0.5em] text-slate-500"
          >
             Socratic guidance enabled. No direct answers will be provided.
          </motion.div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

