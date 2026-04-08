import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { redirect } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
import CreateCourseButton from '@/components/CreateCourseButton';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role || 'student';
  const isTeacher = role === 'teacher';

  let courses: any[] = [];
  let queryError = null;

  if (!isTeacher) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*, lessons:lessons(count))')
      .eq('user_id', user.id);
      
    if (data) {
      courses = data.map((e: any) => ({ ...e.courses, progress: e.progress || 0 })).filter(Boolean);
    }
    queryError = error;
  } else {
    const { data, error } = await supabase
      .from('courses')
      .select(`id, title, created_at, lessons:lessons(count)`)
      .order('created_at', { ascending: false });
    courses = data || [];
    queryError = error;
  }

  return (
    <div className="bg-[#020617] text-white px-6 py-4 sm:px-10 sm:py-6 min-h-full">
      <div className="max-w-7xl mx-auto mt-0 sm:mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Course Library</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-lg">
              {isTeacher ? "Manage your syllabus catalogs and modules." : "Browse your grouped curriculum."}
            </p>
          </div>

          {isTeacher && (
            <CreateCourseButton />
          )}
        </div>

        {queryError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-8 font-medium">
            Failed to load courses: {queryError.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {courses?.length === 0 && (
            <div className="col-span-full py-24 text-center bg-[#0f172a] rounded-3xl border border-[#1e293b] border-dashed flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Layers className="w-10 h-10 text-slate-500" />
              </div>
              
              {isTeacher ? (
                 <>
                   <h3 className="text-2xl font-bold text-white mb-3">No courses available</h3>
                   <p className="text-slate-400 max-w-md mx-auto text-lg">You haven't initialized any course syllabus structures yet.</p>
                 </>
              ) : (
                 <>
                   <h2 className="text-2xl font-black text-white" dir="rtl">היי! נראה שעדיין לא הצטרפת לקורסים.</h2>
                   <Link href="/" className="mt-8 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                     לצפייה בקטלוג הקורסים
                   </Link>
                 </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
