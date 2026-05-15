import React, { useState } from "react";
import { 
  GraduationCap, 
  ChevronRight, 
  ShieldCheck, 
  Mic,
  ArrowUpRight,
  Brain,
  Sparkles,
  Zap,
  Fingerprint,
  Target,
  BadgeCheck
} from "lucide-react";
import { tutorFlip } from "../api";
import { motion, AnimatePresence } from "motion/react";

export default function TutorFlip() {
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [topicIndex, setTopicIndex] = useState(0);

  const topics = [
    { name: "Algebra - Isolation of Variables", prompt: "Why must we perform the same operation on both sides of an equation to keep it balanced?" },
    { name: "Fractions - Common Denominator", prompt: "Explain why we need a common denominator to add two fractions like 1/3 and 1/4." },
    { name: "Science - Density", prompt: "How would you explain the concept of density to a 10-year old? Why do some heavy things float?" }
  ];

  const currentTopic = topics[topicIndex];

  const handleTest = async () => {
    if (!explanation) return;
    setLoading(true);
    try {
      const resp = await tutorFlip('S001', currentTopic.name, explanation);
      const parsed = resp?.data?.result || resp?.data || {};
      setFeedback(parsed);
      setStep(2);
    } catch (e) {
      console.error("AI Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const nextTopic = () => {
    setTopicIndex((prev) => (prev + 1) % topics.length);
    setExplanation("");
    setFeedback(null);
    setStep(1);
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8">
         <div className="space-y-2">
            <div className="status-label text-indigo-400">Tutor Flip Mode</div>
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Mastery Verification</h1>
            <p className="text-slate-600 text-lg font-medium">To master a concept, you must be able to teach it. Explain the logic to Ekalavya.</p>
         </div>
         <button onClick={nextTopic} className="premium-button !bg-white/5 !border !border-white/70 hover:!bg-white/10 !text-slate-500 hover:!text-white">
            <Zap className="w-4 h-4" />
            Switch Challenge
         </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="grid lg:grid-cols-2 gap-10"
          >
            {/* Left: Challenge Panel */}
            <div className="glass-card p-12 bg-white/75 relative overflow-hidden flex flex-col justify-between h-[600px]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
               
               <div className="space-y-8 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                        <Target className="w-6 h-6" />
                     </div>
                     <span className="status-label text-slate-500">Active Concept</span>
                  </div>
                  
                  <div className="space-y-4">
                     <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">{currentTopic.name}</h2>
                     <div className="p-8 bg-white/75 border border-white/70 rounded-[2rem] text-lg text-slate-500 leading-relaxed font-medium transition-all group-hover:text-slate-700 italic border-l-2 border-indigo-500/40">
                        "{currentTopic.prompt}"
                     </div>
                  </div>

                  <div className="space-y-4 pt-8">
                     <p className="status-label text-white/10 uppercase mb-4">Instructions</p>
                     {[
                        "Explain in your own words.",
                        "Use analogies if possible.",
                        "Identify the underlying logic.",
                        "Submit for neural analysis."
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right: Logic Input */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="relative group flex-1">
                <textarea 
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Initiate explanation sequence..."
                  className="w-full h-full min-h-[500px] p-10 bg-[#111827] border border-white/70 rounded-[2rem] text-lg text-white placeholder:text-white/5 focus:outline-none focus:border-indigo-500/40 transition-all resize-none font-medium leading-relaxed shadow-inner backdrop-blur-md"
                />
                <button className="absolute bottom-8 right-8 p-4 bg-white/5 text-slate-500 rounded-2xl border border-white/70 hover:text-white transition-all backdrop-blur-xl group hover:border-indigo-500/20">
                  <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <button 
                onClick={handleTest}
                disabled={!explanation || loading}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-20 transition-all flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {loading ? "Decrypting Logic..." : "Verify Semantic Mastery"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
             key="feedback"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="space-y-10"
          >
              {/* Mastery Analysis Dashboard */}
              <div className="glass-card p-12 bg-white/75 border-white/70 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000" />
                  
                  <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between border-b border-white/70 pb-10 mb-12">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <BadgeCheck className="w-6 h-6 text-emerald-400" />
                           <h2 className="text-3xl font-bold text-white tracking-tight leading-none">Semantic Analysis Complete</h2>
                        </div>
                        <p className="status-label text-white/10 mt-2">Verified Cognitive Path: Arjun Kumar / Session 48</p>
                     </div>
                     <div className="flex items-center gap-8 pr-4">
                        <div className="text-center">
                           <p className="status-label text-slate-500 mb-1">Authenticity</p>
                           <p className="text-3xl font-bold text-emerald-400 tabular-nums leading-none tracking-tighter">{feedback?.authenticity || 0}%</p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div className="text-center">
                           <p className="status-label text-slate-500 mb-1">Fingerprint</p>
                           <p className="text-3xl font-bold text-indigo-400 tabular-nums leading-none tracking-tighter">Match</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <StatRadial label="Clarity" value={feedback?.clarity || 0} color="indigo" />
                     <StatRadial label="Correctness" value={feedback?.correctness || 0} color="emerald" />
                     <StatRadial label="Reasoning" value={feedback?.reasoning_depth || 0} color="purple" />
                     <StatRadial label="Mastery" value={feedback?.concept_understanding || 0} color="amber" />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8 mt-12">
                      <div className="p-10 bg-white/75 border border-white/70 rounded-[2rem] space-y-8 relative overflow-hidden group">
                          <Brain className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                          <h3 className="status-label text-purple-400">Tutor Feedback</h3>
                          <div className="space-y-6 relative z-10">
                             <p className="text-2xl font-bold text-white leading-tight tracking-tight italic">"{feedback?.feedback}"</p>
                          </div>
                      </div>

                      <div className="p-10 border border-indigo-500/20 rounded-[2rem] bg-indigo-600/[0.02] space-y-10 flex flex-col justify-between">
                          <div className="space-y-6">
                              <div className="status-label text-indigo-400 mb-6 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" />
                                  Probing Knowledge
                              </div>
                              <div className="p-8 bg-white/85 rounded-[2rem] border border-white/70 font-medium text-slate-700 text-lg leading-relaxed italic border-l-4 border-indigo-500/40 shadow-inner">
                                  {feedback?.follow_up_question}
                              </div>
                          </div>
                          <button 
                              onClick={() => { setStep(1); setExplanation(""); setFeedback(null); }}
                              className="premium-button !py-5 !rounded-2xl !text-xs !bg-white !text-black hover:!bg-indigo-50 shadow-2xl shadow-white/5"
                          >
                              Challenge Response
                          </button>
                      </div>
                  </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRadial({ label, value, color }: any) {
  const colors: any = {
    indigo: 'text-indigo-400 bg-indigo-500 shadow-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500 shadow-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500 shadow-purple-500/20',
    amber: 'text-amber-400 bg-amber-500 shadow-amber-500/20',
  };
    return (
        <div className="bg-white/75 p-8 rounded-[2rem] border border-white/70 text-center flex flex-col justify-center transition-all hover:bg-white/[0.04] group">
            <p className="status-label text-slate-500 mb-4 group-hover:text-slate-500 transition-colors uppercase tracking-[0.2em]">{label}</p>
            <p className="text-4xl font-bold text-white tracking-tighter tabular-nums mb-6 group-hover:scale-110 transition-transform">{value}%</p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/70">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${value}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={cn("h-full rounded-full", colors[color])} 
                />
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

