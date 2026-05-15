import React, { useEffect, useState } from "react";
import { 
  Printer, 
  Download, 
  Share2, 
  ChevronLeft,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  Zap,
  Fingerprint,
  Target,
  BrainCircuit,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { getStudent } from "../api";
import { motion } from "motion/react";

export default function SessionReport() {
  const [student, setStudent] = useState<any>(null);
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

  if (loading || !student) return <div className="flex h-[60vh] items-center justify-center text-slate-500 uppercase tracking-widest font-bold">Compiling Session Intelligence...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between no-print mb-8">
         <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-all">
            <ChevronLeft className="w-4 h-4" />
            Back to Command
         </button>
         <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 border border-white/70 rounded-xl text-slate-500 hover:text-white transition-all">
               <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => window.print()} className="premium-button !py-2.5 !px-5 flex items-center gap-2">
               <Printer className="w-4 h-4" />
               Print Intelligence Report
            </button>
         </div>
      </div>

      <div className="bg-white p-12 md:p-20 text-[#0A0F1E] rounded-[3rem] shadow-4xl relative overflow-hidden print:shadow-none print:m-0 print:border-none print:p-10">
         {/* Branding / Header */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b-2 border-[#0A0F1E]/5 pb-10 mb-16">
            <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1.5 p-2 bg-[#0A0F1E] rounded-xl">
                      <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter uppercase italic text-[#0A0F1E]">Ekalavya</h1>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Official Learning Intelligence Report</p>
                  <p className="text-sm font-bold opacity-20">Session Verification ID: EK-7722-X9</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-right">
               <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Student</p>
                  <p className="text-base font-black">{student.name}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Level</p>
                  <p className="text-base font-black">{student.current_level}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Date</p>
                  <p className="text-sm font-bold opacity-60">May 15, 2024</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Time</p>
                  <p className="text-sm font-bold opacity-60">14:45 GMT</p>
               </div>
            </div>
         </div>

         {/* Summary Row */}
         <div className="grid md:grid-cols-3 gap-10 mb-20">
            <ReportStat label="Proof of Thought" value="92.4%" icon={<Zap className="w-5 h-5" />} color="indigo" />
            <ReportStat label="Authenticity" value="Verified" icon={<ShieldCheck className="w-5 h-5" />} color="emerald" />
            <ReportStat label="Cognitive Load" value="Optimal" icon={<Target className="w-5 h-5" />} color="amber" />
         </div>

         {/* Deep Analysis */}
         <div className="space-y-16">
            <div className="space-y-8">
               <h2 className="text-xl font-black uppercase tracking-[0.3em] flex items-center gap-4 opacity-10">
                  <Fingerprint className="w-5 h-5" />
                  Cognitive Fingerprint Analysis
                  <div className="flex-1 h-px bg-[#0A0F1E]/5" />
               </h2>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="p-8 bg-[#0A0F1E]/[0.02] border border-[#0A0F1E]/5 rounded-[2rem] space-y-6">
                     <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Neural Engagement Patterns</h3>
                     <div className="space-y-8">
                        <ReportBar label="Socratic Retention" val={88} />
                        <ReportBar label="Semantic Consistency" val={95} />
                        <ReportBar label="Prompt Reasoning" val={81} />
                     </div>
                  </div>
                  <div className="p-8 border border-[#0A0F1E]/5 rounded-[2rem] space-y-6">
                     <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Session Highlights</h3>
                     <ul className="space-y-6">
                        <li className="flex gap-4 text-sm font-bold leading-relaxed opacity-60">
                           <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5"><Award className="w-3 h-3 text-emerald-600" /></div>
                           "Successfully deduced the Balance Principle in Linear Equations during Socratic Phase."
                        </li>
                        <li className="flex gap-4 text-sm font-bold leading-relaxed opacity-60">
                           <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5"><MessageSquare className="w-3 h-3 text-indigo-600" /></div>
                           "Provided authentic explanation of Common Denominators via Tutor-Flip."
                        </li>
                     </ul>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <h2 className="text-xl font-black uppercase tracking-[0.3em] flex items-center gap-4 opacity-10">
                  <BrainCircuit className="w-5 h-5" />
                  Next Phase Guidance
                  <div className="flex-1 h-px bg-[#0A0F1E]/5" />
               </h2>
               <div className="p-10 border-2 border-dashed border-[#0A0F1E]/10 rounded-[2rem] bg-[#0A0F1E]/[0.01]">
                  <p className="text-xl font-bold italic leading-relaxed opacity-60 text-center max-w-2xl mx-auto">
                     "Student is ready for advanced Quadratic Modeling. We recommend increasing Socratic depth for higher abstraction topics."
                  </p>
               </div>
            </div>
         </div>

         {/* Footer / Signatures */}
         <div className="mt-32 pt-16 border-t border-[#0A0F1E]/5 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2 opacity-30 text-center md:text-left">
               <p className="text-[9px] font-black uppercase tracking-widest font-mono italic">Generated by Ekalavya Neural Core Engine</p>
               <p className="text-xs">This data is based on real-time biometric and semantic analysis.</p>
            </div>
            <div className="w-48 h-16 border-b-2 border-[#0A0F1E]/10 flex flex-col items-center justify-end">
               <p className="text-[9px] font-black uppercase tracking-widest opacity-20 mb-1">AI Advisor Seal</p>
               <Zap className="w-6 h-6 text-[#0A0F1E]/50 mb-2" />
            </div>
         </div>
      </div>
      
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
          .pb-20 { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function ReportStat({ label, value, icon, color }: any) {
   const colors: any = {
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      amber: 'text-amber-600'
   };
   return (
      <div className="text-center p-8 bg-[#0A0F1E]/[0.02] border border-[#0A0F1E]/5 rounded-[2rem] space-y-4">
         <div className={cn("mx-auto w-10 h-10 flex items-center justify-center opacity-30", colors[color])}>
            {icon}
         </div>
         <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{label}</p>
            <p className="text-3xl font-black tracking-tighter">{value}</p>
         </div>
      </div>
   )
}

function ReportBar({ label, val }: { label: string, val: number }) {
   return (
      <div className="space-y-2.5">
         <div className="flex justify-between items-center opacity-60">
            <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
            <p className="text-xs font-black tabular-nums">{val}%</p>
         </div>
         <div className="h-1.5 w-full bg-[#0A0F1E]/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#0A0F1E] opacity-70" style={{ width: `${val}%` }} />
         </div>
      </div>
   )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

