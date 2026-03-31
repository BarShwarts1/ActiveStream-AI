import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { Video, BookOpen, PlayCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicStorefront() {
  const supabase = createServerComponentClient({ cookies });
  const { data: courses } = await supabase.from("courses").select("id, title, created_at, lessons(id)").order("created_at", { ascending: false });

  return (
    <div className="bg-[#020617] min-h-screen text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Absolute Gradient Meshes mapping high end SaaS overlays */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Navbar simulation for public home natively */}
      <nav className="h-16 border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-3xl sticky top-0 z-50 px-6 flex items-center justify-between shadow-2xl">
         <div className="flex items-center gap-4">
             <Link href="/login" className="text-slate-300 hover:text-white font-bold text-sm bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl transition-colors shadow-black/50 border border-slate-700">Login / Sign Up</Link>
         </div>
         <Link href="/" className="flex items-center gap-3 shrink-0 flex-row-reverse">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
             <Video className="w-4 h-4 text-white" />
           </div>
           <span className="font-bold text-white tracking-tight whitespace-nowrap">
             ActiveStream <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI</span>
           </span>
         </Link>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-24 relative z-10">
         <div className="text-center mb-24 max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight" dir="rtl">
                ברוכים הבאים לאקדמיה של <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">ActiveStream</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed" dir="rtl">
                גלו את הקטלוג המלא, הצטרפו לקורסים מקיפים עם וידאו מובנה, תמלול מבוסס AI ותרגולים המייצרים שילוב מושלם.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
            {courses?.map((course: any) => (
               <Link 
                 href={`/course/${course.id}`} 
                 key={course.id} 
                 className="bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl border border-[#1e293b] overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all group flex flex-col text-right hover:-translate-y-1"
               >
                  <div className="w-full h-56 bg-gradient-to-br from-slate-900 to-[#020617] relative overflow-hidden flex items-center justify-center border-b border-[#1e293b]/50">
                    <BookOpen className="w-16 h-16 text-slate-700/50 group-hover:scale-110 group-hover:text-indigo-500/30 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent z-10 opacity-90"></div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col relative z-20 -mt-6">
                     <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase bg-[#020617] px-4 py-1.5 rounded-full border border-indigo-500/20 inline-flex self-end mb-5 shadow-xl">
                        {course.lessons?.length || 0} פרקים
                     </span>
                     <h3 dir="rtl" className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {course.title}
                     </h3>
                     <div className="flex-1"></div>
                     <div className="mt-8 pt-5 border-t border-[#1e293b] flex flex-row-reverse items-center justify-between text-slate-400 font-bold group-hover:text-white transition-colors">
                        <span>למידע נוסף והרשמה</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <PlayCircle className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
                        </div>
                     </div>
                  </div>
               </Link>
            ))}
         </div>
         {courses?.length === 0 && (
             <div className="w-full py-32 text-center bg-[#0f172a]/30 rounded-3xl border border-[#1e293b] border-dashed flex flex-col items-center">
                <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-400" dir="rtl">לא נמצאו קורסים כרגע במערכת.</h3>
             </div>
         )}
      </main>
    </div>
  );
}
