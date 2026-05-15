import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Sparkles, 
  Timer, 
  Smile, 
  ChevronRight,
  Volume2,
  BookOpen,
  Coffee,
  Brain,
  Zap,
  Target
} from "lucide-react";
import { simplifyText } from "../api";
import { motion, AnimatePresence } from "motion/react";

export default function LessonPage() {
  const [content, setContent] = useState("");
  const [simplified, setSimplified] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [simplifyError, setSimplifyError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const normalizeSimplified = (raw: any) => {
    const fallbackEasy = "Here is a simpler explanation of your content.";
    return {
      easy_version: raw?.easy_version || raw?.summary || fallbackEasy,
      bullet_points: Array.isArray(raw?.bullet_points) ? raw.bullet_points : [],
      summary: raw?.summary || "",
      key_terms: Array.isArray(raw?.key_terms) ? raw.key_terms : [],
      simple_example: raw?.simple_example || "Think of it as doing the same balanced step on both sides.",
      suggested_questions: Array.isArray(raw?.suggested_questions) ? raw.suggested_questions : [],
    };
  };

  const startTimer = () => {
    setIsRunning(true);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSimplify = async () => {
    if (!content) return;
    setSimplifyError(null);
    setLoading(true);
      try {
         const resp = await simplifyText(content);
         const parsed = resp?.data?.data || resp?.data || {};
         const normalized = normalizeSimplified(parsed);
         setSimplified(normalized);
         setIsSimplified(true);
    } catch (e) {
      console.error("AI Error:", e);
      setSimplified(normalizeSimplified({}));
      setIsSimplified(true);
      setSimplifyError("Could not fetch AI output. Showing fallback simplified view.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setTtsState('idle');
    setTtsState('playing');
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sampleLesson = "A linear equation is an equation that may be put in the form a₁x₁ + ... + aₙxₙ + b = 0, where x₁, ..., xₙ are the variables, and b, a₁, ..., aₙ are the coefficients. Linear equations occur frequently in all mathematics and their applications in physics and engineering, partly because non-linear systems are often well approximated by linear equations.";

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Dynamic Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/85 border border-white/80 p-5 rounded-[2rem] backdrop-blur-xl px-10 shadow-lg shadow-indigo-500/10">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-indigo-400/50" />
              <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tighter">{formatTime(timer)}</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={isRunning ? stopTimer : startTimer}
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isRunning ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-xl shadow-rose-500/5" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-xl shadow-emerald-500/5")}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
              onClick={() => speak(isSimplified ? simplified?.easy_version : content)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all shadow-sm"
           >
              <Volume2 className="w-5 h-5" />
           </button>
           <button 
              onClick={handleSimplify}
              disabled={loading || !content}
              className="premium-button !py-3.5 !px-8 disabled:opacity-20 flex items-center gap-3"
           >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Simplify
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
         {/* Reader Area */}
         <div className="lg:col-span-8">
            <div className="glass-card p-12 bg-white/85 rounded-3xl border border-white/80 min-h-[600px] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/[0.03] blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000" />
               <div className="relative z-10 mb-8">
                  <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 mb-3">
                    Paste Lesson Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (isSimplified) setIsSimplified(false);
                    }}
                    placeholder="Paste your topic notes/content here..."
                    className="w-full min-h-[140px] resize-y rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  {simplifyError && (
                    <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      {simplifyError}
                    </p>
                  )}
               </div>
               
               {!content && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-32 relative z-10 transition-all group-hover:scale-105">
                      <div className="w-20 h-20 bg-white/75 rounded-[2rem] flex items-center justify-center border border-white/70 shadow-2xl">
                          <BookOpen className="w-10 h-10 text-indigo-300" />
                      </div>
                      <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Calm Study Space</h3>
                          <p className="text-slate-500 text-lg max-w-sm mx-auto font-medium">Insert course material or start with our foundational sample.</p>
                      </div>
                      <button 
                        onClick={() => setContent(sampleLesson)}
                        className="status-label !tracking-[0.4em] py-4 px-8 border border-slate-200 bg-white rounded-2xl hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                      >
                        Load Foundation Sample
                      </button>
                  </div>
               )}

               <div className="relative z-10">
                  <AnimatePresence mode="wait">
                     {isSimplified ? (
                        <motion.div 
                          key="simplified"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="space-y-12"
                        >
                           <div className="flex items-center justify-between">
                              <span className="status-label text-indigo-400 py-1.5 px-4 bg-indigo-500/5 rounded-full border border-indigo-500/20">AI Translation</span>
                              <button onClick={() => setIsSimplified(false)} className="status-label text-slate-500 hover:text-indigo-700 transition-colors">Original Source</button>
                           </div>

                           <div className="space-y-6">
                              <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight italic text-center max-w-2xl mx-auto">
                                 "{simplified.easy_version}"
                              </p>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                              <div className="p-8 bg-white/75 border border-white/70 rounded-[2rem] space-y-4 hover:bg-white/75 transition-all group/card shadow-xl">
                                 <div className="flex items-center gap-3">
                                    <Brain className="w-4 h-4 text-purple-400 group-hover/card:scale-125 transition-transform" />
                                    <p className="status-label text-slate-500">Conceptual Analogy</p>
                                 </div>
                                 <p className="text-lg font-medium text-slate-600 leading-relaxed italic">"{simplified.simple_example}"</p>
                              </div>
                              <div className="p-8 bg-white/75 border border-white/70 rounded-[2rem] space-y-6 shadow-xl">
                                 <div className="flex items-center gap-3">
                                    <Target className="w-4 h-4 text-emerald-400" />
                                    <p className="status-label text-slate-500">Neural Terminology</p>
                                 </div>
                                 <div className="flex flex-wrap gap-2.5">
                                    {simplified.key_terms.map((t: string) => (
                                       <span key={t} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-700 uppercase tracking-widest shadow-sm">
                                          {t}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="p-10 bg-white/75 border border-white/70 rounded-[2rem] mt-8 shadow-3xl">
                              <h3 className="status-label text-slate-500 mb-8 !tracking-[0.3em]">Knowledge Checkpoint</h3>
                              <ul className="space-y-6">
                                 {simplified.suggested_questions?.map((q: string, i: number) => (
                                    <li key={i} className="flex gap-5 group cursor-pointer">
                                       <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/70 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">{i+1}</span>
                                       <p className="text-lg font-medium text-slate-600 group-hover:text-indigo-700 transition-colors">{q}</p>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </motion.div>
                     ) : content && (
                        <motion.div 
                          key="original"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-12"
                        >
                           <div className="flex items-center justify-between">
                              <h2 className="status-label text-slate-500">Original Source Document</h2>
                              <div className="flex gap-2">
                                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                 <span className="status-label text-indigo-400">Authentic Content</span>
                              </div>
                           </div>
                           <p className="text-3xl md:text-4xl font-bold text-slate-900 leading-[1.3] transition-all hover:text-slate-800 cursor-text selection:bg-indigo-600/30">
                              {content}
                           </p>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </div>

         {/* Context Column */}
         <div className="lg:col-span-4 space-y-8">
            <div className="glass-card p-10 bg-white/80 border-white/80 space-y-10 group">
               <div className="space-y-1 px-2">
                  <h3 className="status-label text-slate-700 tracking-[0.2em] flex items-center gap-3">
                     <Coffee className="w-4 h-4 text-emerald-400" />
                     Learning State
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Biometric Mood Sync</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  {['Optimal', 'Confusion', 'Neural Fatigue', 'Hyperfocus'].map((m) => (
                     <button 
                        key={m}
                        onClick={() => setMood(m)}
                        className={cn("py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all border shadow-sm", mood === m ? "bg-indigo-600 text-white border-indigo-600 scale-105" : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700")}
                     >
                        {m}
                     </button>
                  ))}
               </div>

               <div className="space-y-6 pt-10 border-t border-white/70">
                  <div className="flex items-center gap-3">
                     <Zap className="w-4 h-4 text-amber-400" />
                     <p className="status-label text-slate-700 !tracking-widest">Active Analysis</p>
                  </div>
                  <div className="p-6 bg-white/75 border border-white/70 rounded-[1.5rem] space-y-4">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Scanning Path...</p>
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Conceptual Grip</span>
                        <span className="text-sm font-bold text-indigo-400 tabular-nums">74%</span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "74%" }}
                           className="h-full bg-indigo-500" 
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/40">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[100px] rounded-full -mr-24 -mt-24 transition-transform duration-[2000ms] group-hover:scale-150" />
               <div className="space-y-6 relative z-10">
                  <div className="status-label text-slate-500 !tracking-[0.4em]">Next Phase</div>
                  <h4 className="text-3xl font-bold tracking-tight leading-snug">Neural Recall Quiz Ready</h4>
                  <p className="text-indigo-100/60 font-medium leading-relaxed">Transition into verification mode to anchor these concepts into long-term memory.</p>
                  <button className="w-full py-5 bg-white text-indigo-600 rounded-[1.8rem] font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 hover:scale-[1.03] transition-all shadow-3xl">
                     Initiate Verification
                     <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

