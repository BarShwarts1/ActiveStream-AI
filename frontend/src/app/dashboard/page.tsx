import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { PlusCircle, PlayCircle, Clock, Video } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const role = session.user?.user_metadata?.role || 'student';
  const isTeacher = role === 'teacher';

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      video_url,
      created_at,
      courses (
        title
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-lg">
              {isTeacher ? "Manage your teaching materials and active sessions." : "Access your active learning sessions and study tools."}
            </p>
          </div>
          
          {isTeacher && (
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-all shadow-lg shadow-indigo-500/20">
              <PlusCircle className="w-5 h-5 me-2" />
              Upload Lesson
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-8 font-medium">
            Failed to load lessons: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {lessons?.map((lesson: any) => (
            <Link 
              key={lesson.id} 
              href={`/lesson/${lesson.id}`}
              className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all group flex flex-col"
            >
              <div className="w-full h-48 bg-slate-800/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent z-10 opacity-80"></div>
                
                {lesson.video_url?.includes('youtube.com') || lesson.video_url?.includes('youtu.be') || lesson.video_url?.length === 11 ? (
                  <img 
                    src={`https://img.youtube.com/vi/${lesson.video_url.includes('v=') ? lesson.video_url.split('v=')[1]?.split('&')[0] : lesson.video_url.split('/').pop()}/mqdefault.jpg`}
                    alt={lesson.title}
                    className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-14 h-14 bg-indigo-500/90 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 duration-300 shadow-lg shadow-indigo-500/50">
                    <PlayCircle className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs font-bold text-indigo-400 tracking-wider uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    {lesson.courses?.title || "ActiveStream Course"}
                  </div>
                </div>
                <h3 dir="rtl" className="text-lg font-black text-right text-white mb-4 line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                  {lesson.title}
                </h3>
                <div className="mt-auto flex items-center text-slate-400 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(lesson.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </Link>
          ))}

          {lessons?.length === 0 && (
            <div className="col-span-full py-24 text-center bg-[#0f172a] rounded-3xl border border-[#1e293b] border-dashed">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No lessons available</h3>
              <p className="text-slate-400 max-w-md mx-auto text-lg">
                {isTeacher 
                  ? "You haven't uploaded any lessons yet. Click 'Upload Lesson' to get started and build your course."
                  : "Check back later when your teachers have published new interactive lessons."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
