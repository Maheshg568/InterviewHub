import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, MessageSquareText, Fingerprint, GraduationCap, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isTeacher = location.pathname.startsWith("/teacher");
  const isLanding = location.pathname === "/";
  const isLogin = location.pathname === "/login";

  if (isLanding || isLogin) return <>{children}</>;

  const navigation = isTeacher ? [
    { name: "Intelligence", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Reports", href: "/teacher/report", icon: BookOpen },
    { name: "Cognitive DNA", href: "/teacher/dna", icon: Fingerprint },
  ] : [
    { name: "Command Center", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Focused Study", href: "/student/lessons", icon: BookOpen },
    { name: "AI Advisor", href: "/student/tutor", icon: MessageSquareText },
    { name: "Recall Mode", href: "/student/quiz", icon: GraduationCap },
    { name: "Intelligence", href: "/student/dna", icon: Fingerprint },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#E0F2FE] text-slate-900 overflow-hidden">
      {/* Top Proctor Bar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <div className="hidden md:flex flex-col leading-none">
              <span className="font-bold text-sm text-white">Ekalavya</span>
              <span className="text-[10px] text-indigo-100 uppercase tracking-[0.08em]">Learning Beyond Limits</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 hidden md:flex items-center justify-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn("px-3 py-5 text-sm border-b-2 transition", location.pathname === item.href ? "text-white border-white" : "text-indigo-100 border-transparent hover:text-white")}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-indigo-50 text-sm hidden sm:block">04:15</div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">A</div>
            <div className="text-indigo-50 text-sm">Alice Demo</div>
          </div>
          <div className="ml-2 px-4 py-1 bg-emerald-500 text-white rounded-full text-xs font-medium">All Clear</div>
          <Link
            to="/login"
            className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
