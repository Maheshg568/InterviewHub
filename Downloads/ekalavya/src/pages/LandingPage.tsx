import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Fingerprint,
  Sparkles,
  LineChart,
  BookOpen,
} from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#1f2937] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f97316]/20 blur-3xl" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-[#0ea5e9]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#facc15]/15 blur-3xl" />
      </div>

      <nav className="relative z-10 mx-auto flex h-24 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-lg shadow-slate-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="text-2xl font-black tracking-tight text-[#0f172a]">Ekalavya</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#64748b]">Learning Beyond Limits</p>
          </div>
        </div>
        <Link
          to="/login"
          className="rounded-2xl border border-[#cbd5e1] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#0f172a] transition hover:border-[#0f172a]"
        >
          Enter App
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-28 pt-14 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#fdba74] bg-[#fff7ed] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[#ea580c]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c2410c]">Adaptive AI Learning Platform</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-black tracking-tight text-[#0f172a] md:text-7xl">Master concepts, not just answers.</h1>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-[#475569]">
              Ekalavya personalizes every learning session with Socratic tutoring, proof-based mastery, and real-time teacher insights.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0f172a] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#1e293b]"
            >
              Student Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-[#94a3b8] bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0f172a] transition hover:border-[#0f172a]"
            >
              Teacher Portal
            </Link>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-4 pt-2">
            <StatCard value="92%" label="Retention Lift" />
            <StatCard value="24/7" label="Tutor Access" />
            <StatCard value="Live" label="Teacher Alerts" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-[#e2e8f0] bg-white p-6 shadow-2xl shadow-slate-300/30"
        >
          <div className="rounded-[1.5rem] border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Session Snapshot</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Active</span>
            </div>

            <div className="space-y-4">
              <QuickRow icon={<BrainCircuit className="h-4 w-4" />} title="Socratic Tutor" text="Asks guiding questions before revealing hints." />
              <QuickRow icon={<Fingerprint className="h-4 w-4" />} title="Learning DNA" text="Maps pace, memory curves, and confusion points." />
              <QuickRow icon={<LineChart className="h-4 w-4" />} title="Proof of Thought" text="Tracks explainability and authentic reasoning." />
              <QuickRow icon={<BookOpen className="h-4 w-4" />} title="Adaptive Lessons" text="Adjusts depth and difficulty in real time." />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-t border-[#e2e8f0] bg-white/70 px-6 py-24 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight text-[#0f172a] md:text-5xl">Built for Real Understanding</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-[#64748b]">
              Every module is designed to verify comprehension through explanation, reflection, and measurable cognitive progress.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Fingerprint className="h-5 w-5 text-[#0284c7]" />}
              title="Cognitive Fingerprint"
              description="Build a live profile of each learner's strengths, blockers, and growth patterns."
            />
            <FeatureCard
              icon={<BrainCircuit className="h-5 w-5 text-[#0284c7]" />}
              title="Guided Discovery"
              description="Socratic prompts push students to reason instead of memorizing surface answers."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5 text-[#0284c7]" />}
              title="Verified Mastery"
              description="Evaluate clarity, logic depth, and confidence to prove authentic understanding."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 text-center">
      <p className="text-2xl font-black tracking-tight text-[#0f172a]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">{label}</p>
    </div>
  );
}

function QuickRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e2e8f0] bg-white p-3">
      <div className="mt-0.5 rounded-lg bg-[#e0f2fe] p-2 text-[#0369a1]">{icon}</div>
      <div>
        <p className="text-sm font-bold text-[#0f172a]">{title}</p>
        <p className="text-xs font-medium leading-relaxed text-[#64748b]">{text}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-[#e2e8f0] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 inline-flex rounded-2xl bg-[#f0f9ff] p-3">{icon}</div>
      <h3 className="text-2xl font-black tracking-tight text-[#0f172a]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-relaxed text-[#64748b]">{description}</p>
    </div>
  );
}
