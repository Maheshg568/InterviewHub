import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Activity, 
  BrainCircuit, 
  Zap, 
  Sparkles, 
  Fingerprint, 
  Target,
  Search,
  BadgeCheck,
  AlertTriangle,
  History,
  Lock
} from "lucide-react";
import { getDNA } from "../api";
import { motion } from "motion/react";

export default function CognitiveFingerprint() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDNA("S001");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Establishing Trust Protocol</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8">
         <div className="space-y-2">
            <div className="status-label text-indigo-400">Integrity & Authenticity</div>
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Cognitive Fingerprint</h1>
            <p className="text-slate-600 text-lg font-medium">A multi-dimensional proof of your thought process, verified via real-time Socratic logic checks.</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-emerald-400" />
               <span className="status-label text-emerald-400 !tracking-widest">Thought Verified</span>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
         {/* Verification Scores */}
         <div className="lg:col-span-8 space-y-10">
            <div className="glass-card p-12 bg-white/75 border-white/70 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000" />
               
               <div className="flex items-center justify-between mb-16 relative z-10">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-bold text-white tracking-tight">Proof of Thought</h3>
                     <p className="status-label text-white/10 uppercase mb-4 tracking-[0.3em]">Session: Algebra / Balancing Logic</p>
                  </div>
                  <div className="text-right">
                     <p className="text-5xl font-bold text-white tracking-tighter tabular-nums leading-none mb-2">92.4</p>
                     <p className="status-label text-slate-500">Aggregate Score</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 relative z-10">
                  <VerificationMetric label="Socratic Engagement" value={88} color="indigo" />
                  <VerificationMetric label="Semantic Consistency" value={95} color="emerald" />
                  <VerificationMetric label="Teaching Accuracy" value={84} color="purple" />
                  <VerificationMetric label="Reasoning Depth" value={91} color="amber" />
               </div>

               <div className="mt-16 pt-10 border-t border-white/70 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Lock className="w-5 h-5 text-white/10" />
                     <p className="text-slate-500 text-xs font-medium">This report is cryptographically signed and verified by Ekalavya AI.</p>
                  </div>
                  <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Download Certificate</button>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="glass-card p-10 bg-white/75 border-white/70 space-y-10 group overflow-hidden">
                  <BrainCircuit className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                  <h3 className="status-label text-purple-400">Mastery Moments</h3>
                  <div className="space-y-4 relative z-10">
                     {[
                        "Simplified Complex Balancing in 3 steps",
                        "Identified Distractor in Linear Equations",
                        "High reasoning depth in Ratio Analogies",
                        "Teacher verified 'AHA' moment in Fractions"
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-5 p-4 rounded-2xl bg-white/75 border border-white/70 shadow-xl transition-all hover:bg-white/[0.05] group/item">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow shadow-emerald-500/20" />
                           <p className="text-sm font-bold text-slate-500 group-hover/item:text-slate-700 transition-colors tracking-tight">{item}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="glass-card p-10 bg-white/75 border-white/70 space-y-10 group overflow-hidden">
                  <AlertTriangle className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                  <h3 className="status-label text-rose-400">Struggle Points</h3>
                  <div className="space-y-4 relative z-10">
                     {[
                        "Reciprocal confusion in division",
                        "Inverse operation sign-error",
                        "Session pause detected (Cognitive Overload)",
                        "Repeated error in Denominator logic"
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-5 p-4 rounded-2xl bg-white/75 border border-transparent shadow-xl transition-all hover:border-rose-500/20 group/item">
                           <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                           <p className="text-sm font-bold text-slate-500 group-hover/item:text-slate-700 transition-colors tracking-tight">{item}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar: Logic Log */}
         <div className="lg:col-span-4 space-y-8">
            <div className="glass-card p-10 bg-white/75 border-white/70 shadow-3xl">
               <div className="flex items-center gap-3 mb-12">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h3 className="status-label text-white !tracking-widest">Verification Log</h3>
               </div>
               
               <div className="space-y-10 relative">
                  <div className="absolute left-[15px] top-6 bottom-6 w-px bg-white/5" />
                  
                  {[
                     { time: '14:22', action: 'Socratic Session', status: 'Verified', color: 'indigo' },
                     { time: '14:15', action: 'Flip-Tutor Record', status: 'Success', color: 'emerald' },
                     { time: '14:02', action: 'Reading Pattern', status: 'Authentic', color: 'indigo' },
                     { time: '13:45', action: 'Login Scan', status: 'Matched', color: 'emerald' },
                     { time: '12:30', action: 'Previous Quiz', status: 'Verified', color: 'indigo' }
                  ].map((log, i) => (
                     <div key={i} className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                           <div className={cn("w-8 h-8 rounded-full border-4 border-obsidian shadow-xl", log.color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600')} />
                           <div>
                              <p className="text-xs font-bold text-white tracking-tight mb-1">{log.action}</p>
                              <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest leading-none">{log.time} GMT</p>
                           </div>
                        </div>
                        <span className={cn("px-3 py-1 bg-white/5 border border-white/70 rounded-lg text-[8px] font-bold uppercase tracking-widest", log.color === 'indigo' ? 'text-indigo-400' : 'text-emerald-400')}>{log.status}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-emerald-600 rounded-[2rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-emerald-500/30">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
               <div className="space-y-6 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                     <BadgeCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">AI Audit Status</p>
                     <p className="text-xl font-bold tracking-tight leading-tight italic">Knowledge integrity is at 98% for this module.</p>
                  </div>
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-5 py-3 rounded-xl hover:bg-white/30 transition-all">
                     View Audit Details
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function VerificationMetric({ label, value, color }: any) {
    const colors: any = {
        indigo: 'text-indigo-400 bg-indigo-500 shadow-indigo-500/20',
        emerald: 'text-emerald-400 bg-emerald-500 shadow-emerald-500/20',
        purple: 'text-purple-400 bg-purple-500 shadow-purple-500/20',
        amber: 'text-amber-400 bg-amber-500 shadow-amber-500/20',
    };
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <p className="status-label text-slate-500 !text-[8px]">{label}</p>
                <p className="text-lg font-bold text-white tabular-nums tracking-tighter">{value}%</p>
            </div>
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

