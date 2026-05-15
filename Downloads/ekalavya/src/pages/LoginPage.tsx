import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, UserCircle, ShieldCheck, BrainCircuit, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/20 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl rounded-[2rem] overflow-hidden relative z-10">
        <div className="p-12 md:p-20 flex flex-col justify-center bg-white/60">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tight text-slate-900 leading-none">Ekalavya</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">Beyond Limits</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Identity Verification</h1>
            <p className="text-slate-600 text-lg mb-12 font-medium">Select your role to initialize the neural interface.</p>
          </motion.div>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full p-4 bg-white/80 border border-slate-200 text-slate-700 rounded-2xl font-semibold hover:bg-white transition-all"
            >
              Back to Dashboard
            </button>
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/student/dashboard")}
              className="group w-full p-6 bg-white border border-slate-200 text-slate-900 rounded-[2rem] flex items-center justify-between hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-colors" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <UserCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Student Portal</p>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Cognitive DNA Access</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-all relative z-10">
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
              </div>
            </motion.button>

            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate("/teacher/dashboard")}
              className="group w-full p-6 bg-white border border-slate-200 text-slate-900 rounded-[2rem] flex items-center justify-between hover:bg-violet-50 hover:border-violet-300 transition-all shadow-lg relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-2xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-600/10 transition-colors" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Teacher Hub</p>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Intelligence Dashboard</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-purple-600 transition-all relative z-10">
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
              </div>
            </motion.button>
          </div>
        </div>

        <div className="hidden md:block relative bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-16 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none" />
          <div className="relative h-full flex flex-col justify-between">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-white/70 backdrop-blur-md mb-8">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span className="status-label text-indigo-400">Verifiable Mastery System</span>
               </div>
            </div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.5 }}
               className="bg-white/90 backdrop-blur-3xl rounded-[2rem] p-10 border border-white shadow-xl space-y-8"
            >
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/70">
                   <BrainCircuit className="text-white w-8 h-8" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="status-label text-slate-600">Proof of Thought</h3>
                   <div className="flex items-center gap-2">
                     <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "94%" }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                        />
                     </div>
                     <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">94.2%</span>
                   </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                  <p className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                     "It is not about completing the task. It is about documenting the reasoning used."
                  </p>
                  <p className="status-label text-slate-500">— Cognitive Identity Principle</p>
               </div>
            </motion.div>

            <div className="p-4 space-y-4">
               <h2 className="text-4xl font-bold text-white leading-[1.1] tracking-tight">Ekalavya Intelligence Platform</h2>
               <p className="text-indigo-100 text-lg font-medium leading-relaxed">Scaling human understanding through verifiable Socratic AI interactions.</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="fixed bottom-10 text-[9px] font-bold text-white/10 uppercase tracking-[0.5em] z-20">Secure Multi-tenant Education Interface v2.4.0</p>
    </div>
  );
}

