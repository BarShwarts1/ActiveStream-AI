"use client";

import { useState, Suspense } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, LogIn, Loader2, Video } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const target = searchParams?.get("redirectTo") || "/dashboard";
        router.push(target);
      } else {
        const finalRole = (role || "student").toLowerCase();
        console.log("SENDING TO SUPABASE:", { email, fullName, role: finalRole });

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: finalRole,
            },
          },
        });
        if (error) throw error;
        // Depending on Supabase settings, sign up might auto-login or require email verification
        // Assuming auto-login bounds
        const target = searchParams?.get("redirectTo") || "/dashboard";
        router.push(target);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-xl border border-[#1e293b] p-8 overflow-hidden relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white text-center mb-2">
            ActiveStream <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI</span>
          </h1>
          <p className="text-[#94a3b8] text-center mb-8 font-medium">
            {isLogin ? "Welcome back to your classroom" : "Join the interactive learning platform"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-[#1e293b] border border-[#334155] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-1">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`py-2 px-4 rounded-lg font-medium transition-all ${
                        role === "student"
                          ? "bg-indigo-500/20 border border-indigo-500 text-indigo-300"
                          : "bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:bg-[#334155]"
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`py-2 px-4 rounded-lg font-medium transition-all ${
                        role === "teacher"
                          ? "bg-purple-500/20 border border-purple-500 text-purple-300"
                          : "bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:bg-[#334155]"
                      }`}
                    >
                      Teacher
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-70 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <LayoutDashboard className="w-5 h-5 mr-2" />}
                  {isLogin ? "התחברות" : "הרשמה"}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors"
            >
              {isLogin ? "אין לך חשבון? הרשמה" : "יש לך חשבון? התחברות"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
