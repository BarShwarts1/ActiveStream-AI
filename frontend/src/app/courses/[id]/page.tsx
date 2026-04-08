import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { BookOpen, Clock, PlayCircle, Video, List, ArrowLeft, User, Layers, Lock } from 'lucide-react';
import UploadLessonButton from '@/components/UploadLessonButton';
import AutoEnrollHandler from '@/components/AutoEnrollHandler';
import EnrollmentButton from '@/components/EnrollmentButton';
import CourseHeaderEditor from '@/components/CourseHeaderEditor';

export const dynamic = 'force-dynamic';

export default async function CourseSyllabusPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createServerComponentClient({ cookies });
  
  // 1. Fetch course details
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, title, description, created_at, teacher_id,
      teacher:users!courses_teacher_id_fkey ( name ),
      lessons ( id, title, video_url, created_at )
    `)
    .eq('id', id)
    .single();

  let finalCourse = course;

  // Fallback for RLS if unauthenticated users cannot view teacher relationship
  if (!finalCourse && error) {
    const { data: fallback } = await supabase
      .from('courses')
      .select('id, title, description, created_at, teacher_id')
      .eq('id', id)
      .single();
    if (fallback) {
      finalCourse = { ...fallback, teacher: null, lessons: [] };
    }
  }

  // Handle missing course
  if (!finalCourse) {
    return (
      <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black mb-2">Course Not Found</h1>
        <p className="text-gray-500 font-medium">This syllabus does not exist or has been deleted.</p>
        <Link href="/my-courses" className="mt-6 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  // 2. Auth checks
  let user: any = null;
  let isTeacher = false;
  let isEnrolled = false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user;
  } catch (e) {}

  if (user) {
    const role = user.user_metadata?.role || 'student';
    isTeacher = role === 'teacher';
    if (!isTeacher) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .maybeSingle();
      isEnrolled = !!enrollment;
    }
  }

  const hasAccess = isTeacher || isEnrolled;
  const isGuest = !user;
  const lessons = finalCourse.lessons ? [...finalCourse.lessons].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];
  const instructorName = finalCourse.teacher?.name || 'Instructor';
  const description = finalCourse.description || 'קורס חשוב מאוד, כל מקצוען חייב לדעת אותו.';

  return (
    <div className="bg-[#020617] text-white px-6 py-4 sm:px-10 sm:py-8 min-h-full font-sans">
      <AutoEnrollHandler courseId={id} />
      
      <div className="max-w-[1000px] mx-auto">
        
        {/* Navigation Breadcrumb */}
        <Link href="/my-courses" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>

        {/* ── COURSE HEADER HERO ── */}
        <div className="relative bg-[#0f172a] rounded-3xl border border-[#1e293b] p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl flex flex-col-reverse md:flex-row gap-10 md:items-start md:justify-between">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none z-0"></div>
          
          {/* Left Column: Icon, Meta & Instructor */}
          <div className="relative z-10 flex flex-col gap-6 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-10 h-10 text-white" />
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-[#1e293b] border border-[#334155] px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest text-indigo-300 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {lessons.length} Module{lessons.length !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5" dir="rtl">
                <Clock className="w-3.5 h-3.5" />
                {new Date(finalCourse.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-400 border border-[#334155]">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Instructor</span>
                <span className="text-sm font-bold text-slate-200" dir="rtl">{instructorName}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title & Description — wrapped by editor for teachers */}
          {isTeacher ? (
            <CourseHeaderEditor courseId={id} initialTitle={finalCourse.title} initialDescription={description}>
              <h1 dir="rtl" className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                {finalCourse.title}
              </h1>
              <p dir="rtl" className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
                {description}
              </p>
            </CourseHeaderEditor>
          ) : (
            <div className="relative z-10 flex-col flex-1 text-right flex items-end justify-center pt-2">
              <h1 dir="rtl" className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                {finalCourse.title}
              </h1>
              <p dir="rtl" className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
                {description}
              </p>

              {!hasAccess && (
                <div className="mt-10 mr-auto flex justify-end w-full">
                   <EnrollmentButton courseId={id} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COURSE MODULES SECTION ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-lg shadow-indigo-500/50"></span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Course Modules</h2>
            <span className="bg-[#1e293b] text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-[#334155]">
              {lessons.length} Module{lessons.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {isTeacher && (
            <UploadLessonButton courseId={id} />
          )}
        </div>

        {/* ── LESSONS LIST ── */}
        <div className="space-y-4">
          {lessons.map((lesson: any, index: number) => {
             const InnerCard = (
                <div className={`w-full bg-[#0f172a] rounded-[1.25rem] border border-[#1e293b] p-5 flex items-center gap-6 transition-all shadow-sm ${hasAccess ? 'group hover:border-indigo-500/50 hover:bg-[#131c31] hover:shadow-lg' : 'opacity-[0.95]'}`}>
                  
                  {/* Left: Index Circle */}
                  <div className={`w-14 h-14 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-400 font-black text-xl border border-[#334155] shadow-inner shrink-0 transition-colors ${hasAccess ? 'group-hover:bg-indigo-500 group-hover:block group-hover:text-white group-hover:border-indigo-500' : ''}`}>
                    {index + 1}
                  </div>

                  {/* Middle: Text (RTL aligned to Right) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center items-end" dir="rtl">
                    <h3 className={`text-[19px] font-black text-slate-100 mb-1 truncate transition-colors ${hasAccess ? 'group-hover:text-indigo-400' : ''}`}>
                      {lesson.title}
                    </h3>
                    <div className="flex items-center justify-end text-[13px] text-slate-500 font-medium tracking-wide">
                      Interactive Video Session
                      <Video className="w-3.5 h-3.5 ms-1.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Right: Icon (Play or Lock) */}
                  <div className={`w-[3.25rem] h-[3.25rem] rounded-full border-2 border-[#1e293b] bg-[#020617] flex items-center justify-center shrink-0 shadow-sm transition-all ${hasAccess ? 'group-hover:border-indigo-500 group-hover:bg-indigo-500/10' : ''}`}>
                    {hasAccess ? (
                      <PlayCircle className="w-[1.65rem] h-[1.65rem] text-slate-500 group-hover:text-indigo-400 transition-colors ms-0.5" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>
             );

             return hasAccess ? (
               <Link key={lesson.id} href={`/lesson/${lesson.id}`} className="block outline-none">
                 {InnerCard}
               </Link>
             ) : (
               <div key={lesson.id}>
                 {InnerCard}
               </div>
             );
          })}

          {lessons.length === 0 && (
            <div className="py-24 text-center bg-[#0f172a] rounded-[1.25rem] border border-[#1e293b] border-dashed shadow-sm">
              <div className="w-20 h-20 bg-[#1e293b] border border-[#334155] shadow-inner rounded-full flex items-center justify-center mx-auto mb-5">
                <List className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Syllabus Empty</h3>
              <p className="text-slate-400 max-w-md mx-auto text-base">
                No modules have been published to this catalog yet. 
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
