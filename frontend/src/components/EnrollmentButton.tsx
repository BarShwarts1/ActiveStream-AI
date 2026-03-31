"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2, ArrowLeft, PlayCircle } from "lucide-react";

export default function EnrollmentButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [status, setStatus] = useState<"loading" | "logged-out" | "not-enrolled" | "enrolled">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function checkAuthAndEnrollment() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus("logged-out");
        return;
      }
      
      setUserId(session.user.id);

      // Check enrollment
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('course_id', courseId)
        .single();
        
      if (data) {
        setStatus("enrolled");
      } else {
        setStatus("not-enrolled");
      }
    }
    
    checkAuthAndEnrollment();
  }, [courseId, supabase]);

  const handleAction = async () => {
    if (status === "logged-out") {
      router.push(`/login?redirectTo=/course/${courseId}`);
      return;
    }

    if (status === "enrolled") {
      router.push(`/courses/${courseId}`);
      return;
    }

    if (status === "not-enrolled" && userId) {
      setIsProcessing(true);
      try {
        const res = await fetch("http://localhost:8000/api/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, course_id: courseId })
        });
        
        if (!res.ok) throw new Error("API validation failed");
        
        setIsSuccess(true);
        setStatus("enrolled");
        
        // Instant Redirect handling
        setTimeout(() => {
          router.push(`/courses/${courseId}`);
        }, 1200);

      } catch (err) {
        console.error("Enrollment error:", err);
        setIsProcessing(false);
      }
    }
  };

  if (status === "loading") {
    return (
      <button disabled className="w-full bg-[#1e293b] text-slate-400 font-bold py-4 px-8 rounded-xl flex items-center justify-center pointer-events-none opacity-50">
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  return (
    <div className="w-full font-sans">
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`w-full font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl ${
          status === "enrolled" 
            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-black/50" 
            : isSuccess
            ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/20"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span dir="rtl">מבצע הרשמה...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span dir="rtl">הרשמה הושלמה! מעביר...</span>
          </>
        ) : status === "logged-out" ? (
          <>
            <ArrowLeft className="w-5 h-5" />
            <span dir="rtl">קבלו גישה לקורס</span>
          </>
        ) : status === "enrolled" ? (
          <>
            <PlayCircle className="w-5 h-5" />
            <span dir="rtl">המשך למידה</span>
          </>
        ) : (
          <>
            <ArrowLeft className="w-5 h-5" />
            <span dir="rtl">הרשמה עכשיו (חינם)</span>
          </>
        )}
      </button>
    </div>
  );
}

// Temporary inline component for CheckCircle2 since it wasn't imported globally above cleanly.
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
