"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, Shield, Bell, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UserDropdown({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const name = session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || session?.user?.email || "User";
  const email = session?.user?.email || "";

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-300 bg-slate-800/50 ps-2 pe-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline-block">
          {name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Glassmorphic Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-[#0f172a]/95 backdrop-blur-2xl border border-[#1e293b] rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="px-4 py-3 border-b border-[#1e293b] mb-1 bg-gradient-to-b from-[#1e293b]/50 to-transparent">
            <p className="text-sm font-black text-white truncate" dir="rtl">{name}</p>
            <p className="text-xs text-indigo-300/80 truncate font-medium">{email}</p>
          </div>

          <Link 
            href="/settings?tab=profile" 
            onClick={() => setIsOpen(false)}
            className="flex flex-row-reverse items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-indigo-500/10 transition-all w-full group"
          >
            <div className="flex flex-row-reverse items-center gap-3">
              <Settings className="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span dir="rtl">הגדרות אישיות</span>
            </div>
          </Link>

          <Link 
            href="/settings?tab=security" 
            onClick={() => setIsOpen(false)}
            className="flex flex-row-reverse items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-indigo-500/10 transition-all w-full group"
          >
            <div className="flex flex-row-reverse items-center gap-3">
              <Shield className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span dir="rtl">אבטחה וסיסמה</span>
            </div>
          </Link>

          <Link 
            href="/settings?tab=preferences" 
            onClick={() => setIsOpen(false)}
            className="flex flex-row-reverse items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-indigo-500/10 transition-all w-full group"
          >
            <div className="flex flex-row-reverse items-center gap-3">
              <Bell className="w-4 h-4 text-amber-400 group-hover:animate-bounce transition-all" />
              <span dir="rtl">העדפות מערכת</span>
            </div>
          </Link>

          <div className="h-px bg-[#1e293b] my-2" />

          <button 
            onClick={handleLogout}
            className="flex flex-row-reverse items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full text-right"
          >
            <LogOut className="w-4 h-4" />
            <span dir="rtl">התנתק מהמערכת</span>
          </button>
        </div>
      )}
    </div>
  );
}
