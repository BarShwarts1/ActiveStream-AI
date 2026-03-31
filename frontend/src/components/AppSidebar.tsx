"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Video } from "lucide-react";

export default function AppSidebar() {
  const pathname = usePathname();

  // Hide entirely on auth screen
  if (pathname === "/login") return null;

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/my-courses", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="h-full bg-[#0f172a] border-r border-[#1e293b] flex flex-col transition-all duration-300 ease-in-out w-16 hover:w-64 group z-50 shrink-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#1e293b] shrink-0 overflow-hidden bg-[#0f172a]">
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-shadow">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            ActiveStream <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group/item overflow-hidden relative ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-slate-400 group-hover/item:text-white"}`} />
              <span className="ml-4 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                {link.name}
              </span>
              
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapsed Logo Footer */}
      <div className="p-4 border-t border-[#1e293b] shrink-0 flex justify-center group-hover:justify-start overflow-hidden bg-[#0a0f1c]">
        <div className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer">
          <span className="font-black text-slate-500 text-sm hover:text-indigo-400 transition-colors">A</span>
        </div>
        <span className="ml-4 font-bold text-slate-600 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center uppercase tracking-widest">
          Version 1.0
        </span>
      </div>

    </aside>
  );
}
