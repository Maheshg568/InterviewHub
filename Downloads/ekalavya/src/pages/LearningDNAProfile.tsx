import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  History, 
  Activity, 
  Target, 
  TrendingUp, 
  BrainCircuit, 
  Search,
  ChevronDown,
  Info,
  Fingerprint,
  Zap,
  Sparkles,
  Award
} from "lucide-react";
import { getStudent } from "../api";
import { Student } from "../types";
import { motion } from "motion/react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area,
  Line
} from "recharts";

export default function LearningDNAProfile() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getStudent("S001");
        setStudent(res.data);
      } catch (err) {
        console.error(err);
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
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Decoding Cognitive DNA</span>
      </div>
    </div>
  );

  const mockProgressData = [
    { name: 'Mon', score: 65, avg: 70 },
    { name: 'Tue', score: 72, avg: 72 },
    { name: 'Wed', score: 85, avg: 74 },
    { name: 'Thu', score: 82, avg: 73 },
    { name: 'Fri', score: 91, avg: 75 },
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                <Fingerprint className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                 <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Learning DNA</h1>
                 <p className="status-label text-indigo-400">Unique Cognitive Blueprint</p>
              </div>
           </div>
           <p className="text-slate-600 text-lg font-medium max-w-2xl">A high-fidelity mapping of your neural learning architecture, verified through every socratic interaction.</p>
        </div>
        
        <div className="flex items-center gap-3 p-2 bg-white/75 border border-white/70 rounded-[2rem] backdrop-blur-xl shadow-2xl">
           <button className="px-8 py-3 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all">Session Records</button>
           <Link to="/student/fingerprint" className="px-8 py-3 text-slate-600 hover:text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.05] transition-all">Trust Fingerprint</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Core Metric Pillar */}
        <div className="lg:col-span-1 space-y-6">
          <DNACard label="Conceptual Clarity" value={student.dna?.concept_strength} color="indigo" icon={<Sparkles className="w-4 h-4" />} />
          <DNACard label="Memory Retention" value={student.dna?.memory_score} color="emerald" icon={<Target className="w-4 h-4" />} />
          <DNACard label="Cognitive Speed" value={student.dna?.speed_score} color="amber" icon={<Zap className="w-4 h-4" />} />
          <DNACard label="Logic Precision" value={student.dna?.accuracy_score} color="rose" icon={<Activity className="w-4 h-4" />} />
        </div>

        {/* Analytics Dashboard Segment */}
        <div className="lg:col-span-3 space-y-8">
           <div className="glass-card p-12 bg-white/75 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000" />
              
              <div className="flex items-center justify-between mb-16 relative z-10">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Intelligence Growth</h3>
                    <p className="status-label text-white/10">Cognitive development curve</p>
                 </div>
                 <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                       <span className="status-label text-slate-500">Student Pulse</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-white/10 rounded-full" />
                       <span className="status-label text-white/10">Baseline</span>
                    </div>
                 </div>
              </div>

              <div className="h-96 relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockProgressData}>
                       <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold' }} />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#0A0F1E',
                           borderRadius: '24px', 
                           border: '1px solid rgba(255,255,255,0.1)', 
                           boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                           backdropFilter: 'blur(20px)',
                           padding: '16px'
                         }}
                         itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                       />
                       <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                       <Line type="monotone" dataKey="avg" stroke="rgba(255,255,255,0.05)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-card p-10 bg-white/75 overflow-hidden relative group">
                 <BrainCircuit className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                 <h3 className="status-label text-indigo-400 mb-10">Cognitive Profile</h3>
                 <div className="space-y-6 relative">
                    <ProfileStat label="Dominant Style" value={student.dna?.learning_style} />
                    <ProfileStat label="Neural Pace" value={student.dna?.pace} />
                    <ProfileStat label="Exam Readiness" value={`${student.dna?.exam_readiness}%`} highlight />
                 </div>
              </div>

              <div className="glass-card p-10 bg-white/75 flex flex-col justify-between">
                 <h3 className="status-label text-slate-500 mb-10 italic underline decoration-white/5 underline-offset-8">Intelligent Recommendations</h3>
                 <div className="space-y-4">
                    <RecommendationItem color="indigo" text="In-depth Socratic feedback recommended for Vectors" />
                    <RecommendationItem color="emerald" text="Mastery verified in Calculus. Proceed to Linear Maps." />
                    <RecommendationItem color="amber" text="Learning pace detected as 'Rushed'. Slow down reading." />
                 </div>
                 <div className="mt-10 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <p className="text-[10px] font-bold text-indigo-300 italic leading-relaxed text-center">
                       "Cognitive engagement is at its peak. Your focus during Socratic sessions has increased by 22%."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DNACard({ label, value, color, icon }: any) {
  const colors: any = {
    indigo: 'text-indigo-400 bg-indigo-600/5 border-indigo-500/20 shadow-indigo-600/10',
    emerald: 'text-emerald-400 bg-emerald-600/5 border-emerald-500/20 shadow-emerald-600/10',
    amber: 'text-amber-400 bg-amber-600/5 border-amber-500/20 shadow-amber-600/10',
    rose: 'text-rose-400 bg-rose-600/5 border-rose-500/20 shadow-rose-600/10'
  };
  
  return (
    <div className="bg-white/75 border border-white/70 p-8 rounded-[2rem] group hover:bg-white/[0.04] transition-all hover:scale-[1.02] shadow-2xl backdrop-blur-md">
       <div className="flex items-center justify-between mb-8">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", colors[color])}>
             {icon}
          </div>
          <Info className="w-4 h-4 text-white/10" />
       </div>
       <div className="space-y-1">
          <p className="status-label text-slate-500 !text-[8px]">{label}</p>
          <div className="flex items-baseline gap-2">
             <span className={cn("text-4xl font-bold tracking-tighter tabular-nums", colors[color].split(' ')[0])}>{value}%</span>
             <TrendingUp className="w-4 h-4 text-emerald-500/60" />
          </div>
       </div>
       <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/70 p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", colors[color].split(' ')[0].replace('text', 'bg'))} 
          />
       </div>
    </div>
  );
}

function ProfileStat({ label, value, highlight }: any) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-white/70 last:border-0">
        <span className="status-label text-slate-600">{label}</span>
        <span className={cn("text-lg font-bold tracking-tight", highlight ? "text-emerald-400" : "text-white")}>{value}</span>
    </div>
  );
}

function RecommendationItem({ color, text }: any) {
  const colors: any = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };
  return (
    <div className="flex items-center gap-4 group cursor-pointer p-3.5 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/70 transition-all">
       <div className={cn("w-2 h-2 rounded-full", colors[color])} />
       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{text}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

