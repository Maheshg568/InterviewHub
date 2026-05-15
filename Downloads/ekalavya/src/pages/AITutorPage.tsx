import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  Bot, 
  Volume2,
  History,
  Sparkles,
  Zap,
  Fingerprint,
  RotateCcw,
  BadgeAlert,
  TrendingUp
} from "lucide-react";
import { getDNA, askTutor } from "../api";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello Arjun! I'm **Ekalavya Advisor**. I've synchronized with your **Learning DNA**. I noticed you had some difficulty with **Calculus** recently. How can I guide you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const starterQuestions = [
    "Explain Linear Equations using a scale analogy",
    "Where did I make a mistake in my last session?",
    "Give me a challenge on Ratios",
    "How does my Learning DNA look?"
  ];

  const recognition = useRef<any>(null);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.current.onerror = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      recognition.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const dnaRes = await getDNA("S001");
      const dna = dnaRes.data;

      const tutorRes = await askTutor("S001", currentInput);
      const reply = tutorRes?.data?.reply || tutorRes?.data?.data || "Neural connection intermittent. Please restate.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural bypass failed. Check connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-white/75 rounded-[2rem] border border-white/70 overflow-hidden shadow-3xl relative backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
      {/* Header Segment */}
      <div className="p-8 border-b border-white/70 flex items-center justify-between relative z-10 bg-white/75">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 border border-white/70">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-white tracking-tight">Ekalavya Advisor</h2>
               <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-bold uppercase tracking-widest">Uses Learning DNA</div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="status-label text-slate-600">Stable Neural Link</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="w-12 h-12 bg-white/75 border border-white/70 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
              <History className="w-5 h-5" />
           </button>
           <button className="w-12 h-12 bg-white/75 border border-white/70 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all">
              <RotateCcw className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 flex-1 min-h-0">
         {/* Main Chat Thread */}
         <div className="lg:col-span-3 flex flex-col min-h-0 border-r border-white/70">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-10 space-y-12 scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] space-y-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`status-label text-white/10 px-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {m.role === 'user' ? 'Arjun / Logic Input' : 'Ekalavya / Insight'}
                       </div>
                       <div className={`p-8 rounded-[2rem] shadow-2xl relative border ${
                         m.role === 'user' 
                           ? 'bg-indigo-600 text-white border-indigo-500/50 rounded-tr-none' 
                           : 'bg-white/75 text-slate-700 border-white/70 rounded-tl-none backdrop-blur-md'
                       }`}>
                          <div className="markdown-content">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                          {m.role === 'assistant' && (
                             <button className="absolute bottom-4 right-6 text-white/10 hover:text-white transition-colors">
                                <Volume2 className="w-4 h-4" />
                             </button>
                          )}
                       </div>
                    </div>
                  </motion.div>
                ))}
                
                {loading && (
                   <div className="flex justify-start">
                      <div className="bg-white/75 border border-white/70 p-6 rounded-[1.5rem] flex items-center gap-4">
                         <div className="flex gap-1">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                         </div>
                         <span className="status-label text-indigo-400">Processing Knowledge</span>
                      </div>
                   </div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Segment */}
            <div className="p-8 bg-white/75 border-t border-white/70">
              <div className="max-w-3xl mx-auto space-y-6">
                {(messages.length < 3 && !input) && (
                   <div className="flex flex-wrap justify-center gap-2">
                      {starterQuestions.map(q => (
                        <button key={q} onClick={() => setInput(q)} className="px-4 py-2 bg-white/5 border border-white/70 rounded-xl status-label text-slate-500 hover:text-white hover:bg-white/10 transition-all !tracking-widest">
                           {q}
                        </button>
                      ))}
                   </div>
                )}
                
                <div className="relative group">
                   <button 
                     onClick={toggleListening}
                     className={`absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl transition-all shadow-xl z-20 ${
                       isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white/5 text-slate-500 hover:text-white"
                     }`}
                   >
                     <Mic className="w-5 h-5" />
                   </button>
                   
                   <input 
                     type="text" 
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     placeholder="State your reasoning or ask for guidance..."
                     className="w-full bg-[#111827] border border-white/70 rounded-[2rem] pl-16 pr-20 py-6 text-base text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40 focus:bg-[#151d2e] transition-all shadow-inner"
                   />

                   <button 
                     onClick={handleSend}
                     disabled={!input.trim() || loading}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl disabled:opacity-20 transition-all shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95"
                   >
                     <Send className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
         </div>

         {/* Right Sidebar: Cognitive Context */}
         <div className="hidden lg:flex lg:col-span-1 flex-col p-8 bg-white/75 space-y-10">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <h3 className="status-label text-white">Live Context</h3>
               </div>
               
               <ContextCard label="Weak Topic" value="Line Symmetry" color="rose" icon={<BadgeAlert className="w-3.5 h-3.5" />} />
               <ContextCard label="Learning Style" value="Deductive" color="indigo" icon={<Fingerprint className="w-3.5 h-3.5" />} />
               <ContextCard label="Recent Effort" value="High Intensity" color="emerald" icon={<Zap className="w-3.5 h-3.5" />} />
            </div>

            <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl space-y-4">
               <p className="status-label text-indigo-400">Memory Score</p>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-white tracking-tighter">84.2</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[84%] bg-indigo-500" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ContextCard({ label, value, color, icon }: any) {
  const colors: any = {
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
  };
  return (
    <div className={cn("p-5 border rounded-3xl space-y-2", colors[color])}>
       <div className="flex items-center gap-2 opacity-50">
          {icon}
          <p className="status-label !tracking-widest !text-[8px]">{label}</p>
       </div>
       <p className="text-sm font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}


