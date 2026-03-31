import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Clock, PlayCircle, Video, List, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CourseSyllabusPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      title,
      created_at,
      lessons (
        id,
        title,
        video_url,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error || !course) {
    return (
      <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black mb-2">Course Not Found</h1>
        <p className="text-gray-500 font-medium">This syllabus does not exist or has been deleted.</p>
        <Link href="/my-courses" className="mt-6 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  // Ensure lessons exist and are sorted chronologically
  const lessons = course.lessons ? [...course.lessons].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];

  return (
    <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full">
      <div className="max-w-5xl mx-auto mt-8">
        
        {/* Navigation Breadcrumb */}
        <Link href="/my-courses" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-medium">
          <ArrowRight className="w-4 h-4" />
          Back to Library
        </Link>

        {/* Course Header Hero */}
        <div className="relative bg-[#0f172a] rounded-3xl border border-[#1e293b] p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 end-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -me-48 -mt-48 pointer-events-none"></div>
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ms-32 -mb-32 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <div className="flex justify-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5" />
                    Syllabus
                  </span>
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(course.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <h1 dir="rtl" className="text-4xl sm:text-5xl font-black text-right tracking-tight text-white mb-4 leading-tight">
                {course.title}
              </h1>
              <p dir="rtl" className="text-slate-400 text-lg max-w-2xl text-right leading-relaxed ms-auto">
                ברוכים הבאים לסילבוס. עקבו אחר ההתקדמות בנושאי הקורס וקפצו ישירות למודולי הווידאו החכמים שלנו לתרגול אקטיבי.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            Course Modules
          </h2>
          <span className="text-slate-400 font-medium bg-[#1e293b] px-3 py-1 rounded-full text-sm">
            {lessons.length} {lessons.length === 1 ? 'Module' : 'Modules'}
          </span>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.map((lesson: any, index: number) => (
            <Link 
              key={lesson.id} 
              href={`/lesson/${lesson.id}`}
              className="block bg-[#0f172a] rounded-2xl border border-[#1e293b] p-5 hover:border-indigo-500/50 hover:bg-[#131c31] transition-all group shadow-sm flex items-center gap-6"
            >
              <div className="w-14 h-14 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0 text-xl border border-slate-700 shadow-inner">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0" dir="rtl">
                <h3 className="text-lg font-black text-right text-white mb-1.5 truncate group-hover:text-indigo-400 transition-colors">
                  {lesson.title}
                </h3>
                <div className="flex items-center justify-end text-sm text-slate-500 font-medium w-full">
                  Interactive Video Session
                  <Video className="w-4 h-4 ms-1.5 text-slate-400" />
                </div>
              </div>

              <div className="w-12 h-12 rounded-full border-2 border-[#1e293b] bg-[#020617] flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-500/10 transition-colors shrink-0 shadow-sm">
                <PlayCircle className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors ms-0.5" />
              </div>
            </Link>
          ))}

          {lessons.length === 0 && (
            <div className="py-24 text-center bg-[#0f172a] rounded-3xl border border-[#1e293b] border-dashed">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <List className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Syllabus Empty</h3>
              <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                No modules have been published to this catalog yet. Stand by for the instructor.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
