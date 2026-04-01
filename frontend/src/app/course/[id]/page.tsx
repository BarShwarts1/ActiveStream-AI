import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Lock, PlayCircle, BookOpen, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import EnrollmentButton from "@/components/EnrollmentButton";

export const dynamic = "force-dynamic";

export default async function PublicCourseLandingPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });

  // Auto-redirect enrolled users to the private syllabus
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('course_id', params.id)
      .single();
    
    if (enrollment) {
      redirect(`/courses/${params.id}`);
    }
  }

  // Fetch Public Course Data rigidly
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, 
      title, 
      created_at, 
      lessons (
        id, 
        title, 
        created_at
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !course) {
    return (
      <div className="bg-[#020617] text-white min-h-screen flex items-center justify-center">
        <div className="text-center font-sans">
          <h1 className="text-3xl font-black mb-4">Course Not Found</h1>
          <p className="text-slate-400 mb-8">This public syllabus could not be located.</p>
          <Link href="/login" className="text-indigo-400 hover:underline">Return to Login</Link>
        </div>
      </div>
    );
  }

  const sortedLessons = (course.lessons || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="bg-[#020617] text-white min-h-screen font-sans">
      
      {/* High-End Glassmorphic Hero */}
      <div className="relative overflow-hidden w-full border-b border-[#1e293b]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/10 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 py-20 relative z-10 flex flex-col md:flex-row-reverse items-center justify-between gap-12">
          
          <div className="flex-1 text-right flex flex-col items-end">
            <span className="text-indigo-400 font-bold tracking-widest text-sm uppercase mb-3 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              מסלול למידה מקצועי
            </span>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6" dir="rtl">
              הצטרפו למהפכת הלמידה עם AI
            </h1>
            <p className="text-xl text-slate-300 font-medium mb-8 leading-relaxed max-w-lg" dir="rtl">
              קבלו גישה מלאה לכל התכנים, התמלולים וה-AI Tutor האישי שלכם בתוך סביבת העבודה של <span className="text-white font-bold">{course.title}</span>.
            </p>
            
            <div className="flex items-center flex-row-reverse gap-6 text-slate-400 font-medium text-sm">
              <div className="flex items-center flex-row-reverse gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>{sortedLessons.length} פרקים מלאים</span>
              </div>
              <div className="flex items-center flex-row-reverse gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>תמלול חכם כלול</span>
              </div>
            </div>
          </div>

          {/* Call to Action Sticky Card */}
          <div className="w-full md:w-96 bg-[#0f172a]/80 backdrop-blur-2xl border border-[#1e293b] rounded-3xl shadow-2xl shadow-indigo-900/20 p-8 shrink-0 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            
            <div className="text-right mb-8 relative z-10 hidden md:block">
               <h3 className="text-2xl font-black text-white mb-2" dir="rtl">{course.title}</h3>
               <p className="text-slate-400 text-sm font-medium" dir="rtl">גישה בלתי מוגבלת לזמן ארוך</p>
            </div>
            
            <div className="relative z-10">
              <EnrollmentButton courseId={course.id} />
            </div>

            <p className="text-xs text-slate-500 text-center mt-6 font-medium tracking-wide" dir="rtl">
              גישה מאובטחת • הפעלה מיידית
            </p>
          </div>

        </div>
      </div>

      {/* Curriculum Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 relative">
        <div className="text-right mb-12">
          <h2 className="text-3xl font-black text-white tracking-tight inline-flex items-center flex-row-reverse gap-3">
             <BookOpen className="w-8 h-8 text-indigo-500" /> סילבוס הקורס
          </h2>
          <p className="text-slate-400 text-lg mt-2 font-medium" dir="rtl">סקור את כלל התכנים הזמינים באופן מיידי לאחר הרישום.</p>
        </div>

        <div className="space-y-4 flex flex-col items-end w-full">
          {sortedLessons.map((lesson: any, index: number) => (
            <div 
              key={lesson.id}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-row-reverse items-center justify-between group hover:border-[#334155] transition-all"
            >
              <div className="flex items-center flex-row-reverse gap-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-[#1e293b] text-slate-500 font-bold shrink-0">
                  {index + 1}
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors" dir="rtl">{lesson.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center flex-row-reverse gap-1.5" dir="rtl">
                    <Clock className="w-3.5 h-3.5" /> תוכן וידאו, תמליל ומרחב תרגול מקיף
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 text-slate-600 bg-[#020617] p-3 rounded-full border border-[#1e293b] shadow-inner" title="תוכן נעול">
                <Lock className="w-5 h-5" />
              </div>
            </div>
          ))}

          {sortedLessons.length === 0 && (
            <div className="w-full bg-[#0f172a]/50 border border-dashed border-[#1e293b] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <BookOpen className="w-10 h-10 text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium" dir="rtl">טרם הועלו שיעורים לקורס זה.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
