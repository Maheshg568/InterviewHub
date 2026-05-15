import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  AlertCircle, 
  Activity, 
  BrainCircuit, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Flame,
  AlertTriangle,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import { getTeacherDashboard } from "../api";
import { motion } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getTeacherDashboard();
        setData(res.data);
      } catch (err) {
        console.error("Teacher dashboard failed", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Optimizing Analytics Engine</span>
      </div>
    </div>
  );

  const chartData = data.students.map((s: any) => ({
    name: s.name,
    score: s.fingerprint?.proof_of_thought_score || 0
  }));

  const getPriorityColor = (priority: string) => {
    switch(priority) {
        case 'High': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10';
        case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10';
        default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10';
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Welcome & Stats row */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8">
         <div className="space-y-2">
            <div className="status-label text-purple-400">Command & Control</div>
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Teacher Intelligence</h1>
            <p className="text-slate-600 text-lg font-medium">Real-time student cognitive mapping and mastery verification.</p>
         </div>
         <div className="flex items-center gap-3 bg-white/75 border border-white/70 p-4 rounded-3xl">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last synced 2m ago</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem icon={<Users />} label="Total Students" value={data.total_students} change="+2 verified" isGood />
        <StatItem icon={<BrainCircuit />} label="Proof of Thought" value={`${data.average_proof_score}%`} change="+4.2% clarity" isGood />
        <StatItem icon={<AlertTriangle />} label="Active Alerts" value={data.alerts?.length || 3} change="3 critical" color="text-rose-400" />
        <StatItem icon={<TrendingUp />} label="Concept Mastery" value="High" change="Improving" isGood />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Column: Alerts & Visualization */}
        <div className="lg:col-span-8 space-y-10">
          <div className="glass-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between mb-12">
               <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    Teacher Action Alerts
                  </h2>
                  <p className="status-label text-slate-500">Instructional interventions required</p>
               </div>
               <button className="premium-button !py-2 !px-4 !bg-white/5 !border !border-white/70 !text-slate-500 hover:!text-white hover:!bg-white/10 uppercase tracking-widest">History</button>
            </div>
            
            <div className="space-y-5">
               {(data.alerts?.length ? data.alerts : [
                 { id: 1, name: "Arjun Kumar", topic: "Fractions", problem: "Denominator confusion", priority: "High" },
                 { id: 2, name: "Sneha Reddy", topic: "Calculus", problem: "Logic-gap detected", priority: "Medium" }
               ]).map((alert: any) => (
                  <div key={alert.id} className="p-6 bg-white/75 border border-white/70 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.05] hover:border-white/70 transition-all shadow-xl group/item">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#E0F2FE] border border-white/70 rounded-2xl flex items-center justify-center font-bold text-slate-500 uppercase transition-all shadow-xl group-hover/item:border-rose-500/30 group-hover/item:text-rose-400">
                         {alert.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg tracking-tight leading-none mb-1.5">{alert.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="status-label text-white/10">{alert.topic}</span>
                           <span className="w-1 h-1 bg-white/5 rounded-full" />
                           <span className="text-[11px] font-medium text-slate-600 truncate">{alert.problem}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn("px-5 py-2.5 rounded-2xl border text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2", getPriorityColor(alert.priority))}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {alert.priority}
                    </div>
                  </div>
               ))}
            </div>
          </div>

          <div className="glass-card p-10 bg-white/75">
             <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                   <h2 className="text-2xl font-bold text-white tracking-tight">Proof Distribution</h2>
                   <p className="status-label text-slate-500">Student effort heatmap</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Mastered</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">In Progress</span>
                   </div>
                </div>
             </div>
             <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                        contentStyle={{ backgroundColor: '#0A0F1E', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                    <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={40}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 85 ? '#10b981' : '#6366f1'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right Column: Class Performance Tracker */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass-card p-10 bg-[#0A0F1E] shadow-3xl group">
              <div className="flex items-center justify-between mb-12">
                 <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">Class Roster</h3>
                    <p className="status-label text-white/10">Active Neural Links</p>
                 </div>
                 <button className="w-10 h-10 bg-white/5 rounded-xl border border-white/70 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                    <Filter className="w-4 h-4" />
                 </button>
              </div>

              <div className="space-y-10">
                 {data.students.map((student: any) => (
                    <div key={student.id} className="group/student cursor-pointer">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white/75 border border-white/70 shadow-xl flex items-center justify-center text-slate-500 font-bold text-sm transition-all group-hover/student:border-indigo-500/30 group-hover/student:text-indigo-400 group-hover/student:bg-indigo-500/5">
                                {student.name[0]}
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-bold text-white group-hover/student:text-indigo-300 transition-colors tracking-tight leading-none">{student.name}</p>
                                <div className="flex items-center gap-3">
                                   <span className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500/60 uppercase tracking-widest"><Flame className="w-3 h-3 transition-transform group-hover/student:scale-125" /> {student.dna?.pace || 'Normal'}</span>
                                   <span className="w-1 h-1 bg-white/10 rounded-full" />
                                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{student.current_level}</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-bold text-white tracking-tighter tabular-nums leading-none mb-1">{student.fingerprint?.proof_of_thought_score || '0'}</p>
                             <p className="status-label text-emerald-500/60 !tracking-[0.1em]">Proof</p>
                          </div>
                       </div>
                       <div className="h-1.5 w-full bg-white/75 rounded-full overflow-hidden p-0.5 border border-white/70">
                          <div 
                             className="h-full bg-white/20 rounded-full transition-all duration-1000 group-hover/student:bg-indigo-500/60" 
                             style={{ width: `${student.fingerprint?.proof_of_thought_score || 0}%` }} 
                          />
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-16 pt-8 border-t border-white/70">
                 <button className="w-full py-5 bg-white/75 border-2 border-dashed border-white/70 text-slate-500 rounded-[2rem] status-label hover:border-white/20 hover:text-white transition-all hover:bg-white/[0.04]">
                    Export Detailed Intelligence
                 </button>
              </div>
           </div>

           <div className="bg-purple-600 rounded-[2rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-purple-600/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              <div className="space-y-4 relative z-10">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                    <Sparkles className="w-6 h-6 text-white" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">AI Insight</p>
                    <p className="text-lg font-bold tracking-tight leading-snug">The class is struggling with "Transitive Logic". 4 alerts triggered.</p>
                 </div>
                 <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-4 py-2.5 rounded-xl hover:bg-white/30 transition-all">
                    Prepare Micro-lesson
                    <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, change, isGood, color }: any) {
    return (
        <div className="glass-card p-8 group relative overflow-hidden bg-[#0C1224]">
            <div className={`p-4 rounded-2xl inline-flex mb-8 border transition-all ${color ? 'bg-rose-500/10 border-rose-500/10 text-rose-400' : 'bg-white/5 border-white/70 text-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 group-hover:text-purple-400'}`}>
                {React.cloneElement(icon, { className: 'w-6 h-6' })}
            </div>
            <div className="space-y-2">
                <p className="status-label text-slate-500">{label}</p>
                <div className="flex items-end justify-between">
                   <h3 className={cn("text-3xl font-bold tracking-tight leading-none", color || "text-white")}>{value}</h3>
                   {change && (
                      <div className={cn("flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest", isGood ? "text-emerald-400" : "text-white/10")}>
                          {isGood ? <TrendingUp className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {change}
                      </div>
                   )}
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

