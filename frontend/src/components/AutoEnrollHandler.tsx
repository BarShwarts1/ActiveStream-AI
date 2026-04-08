"use client";

import { useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AutoEnrollHandler({ courseId }: { courseId: string }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const isEnrolling = useRef(false);

  useEffect(() => {
    const search = window.location.search;
    if (search.includes("autoEnroll=true") && !isEnrolling.current) {
      isEnrolling.current = true;
      const forceAutoEnroll = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Student";
          try {
            const res = await fetch("http://localhost:8000/api/enroll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user.id, course_id: courseId, full_name: fullName })
            });

            if (res.status === 201) {
              const url = new URL(window.location.href);
              url.searchParams.delete("autoEnroll");
              window.history.replaceState({}, "", url.toString());
              
              router.refresh();
            }
          } catch (err) {
            console.error("Forced Auto-Enrollment error:", err);
          }
        }
      };
      forceAutoEnroll();
    }
  }, [courseId, supabase, router]);

  return null;
}
