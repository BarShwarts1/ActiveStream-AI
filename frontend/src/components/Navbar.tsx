"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Video, BookOpen, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Don't show navbar on login page to keep it clean
  if (pathname === "/login") return null;

  return (
    <nav className="border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="w-full px-6 sm:px-8">
        <div className="flex justify-end h-16 items-center">
          
          <div className="flex items-center gap-4">
            {isClient && session ? (
              <>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 ps-2 pe-3 py-1.5 rounded-full border border-slate-700">
                  <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline-block">
                    {session.user.user_metadata?.full_name || session.user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors ms-2"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : isClient && !session ? (
              <Link 
                href="/login"
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-indigo-400/50"
              >
                Sign In
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </nav>
  );
}
