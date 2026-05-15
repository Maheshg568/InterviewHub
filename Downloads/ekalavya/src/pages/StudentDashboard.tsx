import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Target, 
  ArrowRight, 
  Star, 
  Activity, 
  BookOpenCheck,
  Brain,
  BrainCircuit,
  Fingerprint,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { getStudent, getAssignments } from "../api";
import { Student, Assignment } from "../types";
import { motion } from "motion/react";

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [studentRes, assignmentsRes] = await Promise.all([
          getStudent("S001"),
          getAssignments()
        ]);
        setStudent(studentRes.data);
        setAssignments(assignmentsRes.data);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !student) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Loading Command Center</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      {/* Top Profile Hero Card */}
      <div className="relative overflow-hidden bg-white/75 border border-white/70 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-sm group">
         <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-600/5 to-transparent pointer-events-none" />
         <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

         <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
               <div className="w-24 h-24 rounded-3xl bg-[#121826] border border-white/70 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  <span className="text-4xl">🧑‍🎓</span>
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center border border-obsidian shadow-xl">
                  <Star className="w-4 h-4 text-white fill-white" />
               </div>
            </div>
            <div className="text-center md:text-left space-y-2">
               <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">Welcome, {student.name.split(' ')[0]}</h1>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest">Lvl {student.current_level}</span>
               </div>
               <p className="text-slate-600 text-lg font-medium max-w-md">Your cognitive engine is stabilized. Ready for the next leap in logic?</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full md:w-auto relative z-10">
            <div className="p-6 bg-white/75 border border-white/70 rounded-3xl text-center space-y-1 min-w-[140px]">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mastery Score</p>
               <p className="text-2xl font-bold text-indigo-400">88.4</p>
            </div>
            <div className="p-6 bg-white/75 border border-white/70 rounded-3xl text-center space-y-1 min-w-[140px]">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cognitive Depth</p>
               <p className="text-2xl font-bold text-purple-400">High</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Command Center Grid */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Futuristic Command Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <CommandAction 
              to="/student/lessons" 
              icon={<BookOpenCheck className="w-6 h-6" />} 
              label="Learning" 
              desc="Focused Modules"
              color="indigo"
            />
            <CommandAction 
              to="/student/tutor" 
              icon={<Brain className="w-6 h-6" />} 
              label="AI Advisor" 
              desc="Instant Support"
              color="cyan"
            />
            <CommandAction 
              to="/student/socratic" 
              icon={<BrainCircuit className="w-6 h-6" />} 
              label="Mentor" 
              desc="Guided Logic"
              color="purple"
            />
            <CommandAction 
              to="/student/quiz" 
              icon={<Target className="w-6 h-6" />} 
              label="Recall" 
              desc="Verify Logic"
              color="emerald"
            />
            <CommandAction 
              to="/student/flip" 
              icon={<Zap className="w-6 h-6" />} 
              label="Flip" 
              desc="Explain Back"
              color="amber"
            />
          </div>

          {/* Real-time Learning DNA Summary Widget */}
          <div className="bg-[#0A0F1E] border border-white/70 rounded-[2rem] p-10 relative overflow-hidden shadow-2xl backdrop-blur-xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-indigo-600/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-xl font-bold text-white tracking-tight">Learning DNA Summary</h3>
                 </div>
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Live cognitive mapping</p>
              </div>
              <Link to="/student/dna" className="premium-button !py-2.5 !px-4">View Full DNA</Link>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { label: 'Conceptual Clarity', val: student.dna?.concept_strength || 65, color: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
                { label: 'Long-term Memory', val: student.dna?.memory_score || 82, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
                { label: 'Logical Accuracy', val: student.dna?.accuracy_score || 74, color: 'bg-cyan-500', glow: 'shadow-cyan-500/20' },
                { label: 'Learning Speed', val: student.dna?.speed_score || 91, color: 'bg-purple-500', glow: 'shadow-purple-500/20' }
              ].map((skill, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{skill.label}</p>
                    <p className="text-sm font-bold text-white tabular-nums tracking-tighter">{skill.val}%</p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/70">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.val}%` }}
                      transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                      className={`h-full ${skill.color} shadow-lg ${skill.glow}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligent Recommendations & Activity */}
        <div className="lg:col-span-4 space-y-8">
           {/* Recommendation Engine Card */}
           <div className="bg-white/75 border border-white/70 rounded-[2rem] p-8 space-y-8 relative overflow-hidden backdrop-blur-xl group">
              <div className="absolute top-0 right-0 px-4 py-2 bg-indigo-600 rounded-bl-3xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="w-3 h-3" />
                 AI Suggested
              </div>
              
              <div className="space-y-2 mt-4">
                 <h3 className="text-xl font-bold text-white tracking-tight">Next Challenge</h3>
                 <p className="text-slate-600 text-sm font-medium leading-relaxed">Based on your recent struggle with **Ratios**, we recommend this Socratic session.</p>
              </div>

              <div className="space-y-4">
                {assignments.slice(0, 2).map((a, i) => (
                  <motion.div 
                    key={a.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      to={a.type === "Lesson" ? "/student/lessons" : "/student/socratic"} 
                      className="flex items-center justify-between p-5 bg-white/75 border border-white/70 hover:border-indigo-500/40 rounded-3xl transition-all group/item shadow-inner"
                    >
                      <div className="space-y-2 overflow-hidden">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             a.type === "Lesson" ? "bg-cyan-400" : "bg-purple-400"
                           )} />
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{a.topic}</p>
                        </div>
                        <h4 className="text-base font-bold text-white truncate leading-none">{a.title}</h4>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover/item:bg-indigo-600 group-hover/item:text-white flex items-center justify-center text-slate-500 transition-all ml-4 shrink-0">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-4">
              <MetricBox 
                icon={<Clock className="w-4 h-4 text-emerald-400" />} 
                label="Learning Pace" 
                value="Steady" 
                sub="1.2 hrs/day"
              />
              <MetricBox 
                icon={<TrendingUp className="w-4 h-4 text-indigo-400" />} 
                label="Growth" 
                value="+14%" 
                sub="Last 7 days"
              />
              <MetricBox 
                icon={<Target className="w-4 h-4 text-amber-400" />} 
                label="Ready Score" 
                value="82%" 
                sub="Exam readiness"
              />
              <MetricBox 
                icon={<ShieldCheck className="w-4 h-4 text-purple-400" />} 
                label="Proof Score" 
                value="94.2" 
                sub="Authentic effort"
              />
           </div>

           {/* Streak Card */}
           <div className="bg-indigo-600 rounded-[2rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              <div className="space-y-1">
                 <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">Learning Momentum</p>
                 <p className="text-5xl font-black italic tracking-tighter leading-none">12 DAYS</p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between">
                 <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Keep the pulse</p>
                 <Activity className="w-5 h-5 text-slate-500 animate-pulse" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CommandAction({ to, icon, label, desc, color }: any) {
  const colors: any = {
    indigo: "from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40",
    cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20 text-purple-400 hover:border-purple-500/40",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400 hover:border-amber-500/40",
  };
  
  return (
    <Link to={to} className={cn(
      "bg-gradient-to-br p-6 rounded-[2rem] border transition-all hover:scale-[1.03] active:scale-[0.98] group flex flex-col items-center text-center backdrop-blur-sm shadow-xl",
      colors[color]
    )}>
      <div className="w-14 h-14 bg-white/75 rounded-2xl flex items-center justify-center mb-4 border border-white/70 group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {icon}
      </div>
      <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] mb-1">{label}</h4>
      <p className="text-[10px] font-bold text-slate-500 tracking-widest truncate w-full">{desc}</p>
    </Link>
  );
}

function MetricBox({ icon, label, value, sub }: any) {
  return (
    <div className="bg-white/75 border border-white/70 p-5 rounded-3xl space-y-3 hover:bg-white/[0.04] transition-all group">
       <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/70 group-hover:scale-110 transition-transform">
             {icon}
          </div>
          <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{value}</p>
       </div>
       <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</p>
          <p className="text-[10px] font-medium text-white/10 truncate tracking-wide">{sub}</p>
       </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

