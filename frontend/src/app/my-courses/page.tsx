import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Layers, PlusCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import CourseCard from '@/components/CourseCard';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const role = session.user?.user_metadata?.role || 'student';
  const isTeacher = role === 'teacher';

  // Fetch courses with a count of their lessons mapping exactly to the schema.sql relations
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      created_at,
      lessons ( id )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full">
      <div className="max-w-7xl mx-auto mt-8">
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
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-all shadow-lg shadow-indigo-500/20">
              <PlusCircle className="w-5 h-5 mr-2" />
              New Course
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-8 font-medium">
            Failed to load courses: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {courses?.length === 0 && (
            <div className="col-span-full py-24 text-center bg-[#0f172a] rounded-3xl border border-[#1e293b] border-dashed">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Layers className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No courses available</h3>
              <p className="text-slate-400 max-w-md mx-auto text-lg">
                {isTeacher 
                  ? "You haven't initialized any course syllabus structures yet."
                  : "You are not enrolled in any grouped curriculums yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
