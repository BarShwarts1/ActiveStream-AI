import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { Video, Brain, AlignRight, Target } from "lucide-react";
import CourseCatalog from "@/components/CourseCatalog";

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
         {/* CTA Trailing Left */}
         <div className="flex items-center gap-4">
             <Link href="/login" className="text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 border border-indigo-500 tracking-wide">
                 התחברות / הרשמה
             </Link>
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight" dir="rtl">
                ברוכים הבאים לאקדמיה של <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 font-black">ActiveStream</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto" dir="rtl">
                גלו את הקטלוג המלא, הצטרפו לקורסים מקיפים עם וידאו מובנה, תמלול מבוסס AI ותרגולים המייצרים שילוב מושלם.
            </p>
         </div>

         {/* Storefront Features Overview Map */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32 max-w-6xl mx-auto w-full">
            <div className="bg-[#0f172a]/50 backdrop-blur-md border border-[#1e293b] rounded-3xl p-8 flex flex-col items-end text-right hover:border-indigo-500/30 transition-colors group">
               <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-indigo-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 ml-auto" dir="rtl">AI Tutor אישי</h3>
               <p className="text-slate-400 font-medium" dir="rtl">ליווי צמוד בכל שלב בשיעור.</p>
            </div>
            <div className="bg-[#0f172a]/50 backdrop-blur-md border border-[#1e293b] rounded-3xl p-8 flex flex-col items-end text-right hover:border-purple-500/30 transition-colors group">
               <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <AlignRight className="w-7 h-7 text-purple-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 ml-auto" dir="rtl">תמלול חכם</h3>
               <p className="text-slate-400 font-medium" dir="rtl">ניווט מהיר בתוך הווידאו לפי טקסט.</p>
            </div>
            <div className="bg-[#0f172a]/50 backdrop-blur-md border border-[#1e293b] rounded-3xl p-8 flex flex-col items-end text-right hover:border-blue-500/30 transition-colors group">
               <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-blue-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 ml-auto" dir="rtl">למידה מותאמת</h3>
               <p className="text-slate-400 font-medium" dir="rtl">קצב התקדמות אישי לכל תלמיד.</p>
            </div>
         </div>

         {/* Advanced Interactive React Course Catalog */}
         <CourseCatalog courses={courses || []} />
      </main>
    </div>
  );
}
