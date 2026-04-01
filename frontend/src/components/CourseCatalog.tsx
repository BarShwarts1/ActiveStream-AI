"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, PlayCircle, Search, Filter } from "lucide-react";

export default function CourseCatalog({ courses }: { courses: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("הכל"); // "All"

  // Defined Storefront SaaS Categories array
  const categories = ["הכל", "מתמטיקה", "תכנות", "ניהול", "עיצוב", "AI"];

  const filteredCourses = (courses || []).filter((course) => {
    // 1. Text match
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Keyword/Category match bounding natively resolving explicit definitions smoothly
    const titleContext = course.title.toLowerCase();
    const categoryMatch = 
        selectedCategory === "הכל" || 
        (selectedCategory === "תכנות" && /תכנות|פיתוח|web|python|react|javascript|code|html|css/i.test(titleContext)) ||
        (selectedCategory === "AI" && /gpt|ai|בינה|מודל|machine|tutor/i.test(titleContext)) ||
        (selectedCategory === "ניהול" && /ניהול|עסקים|management|marketing/i.test(titleContext)) ||
        (selectedCategory === "מתמטיקה" && /מתמטיקה|אלגברה|חשבון|math/i.test(titleContext)) ||
        (selectedCategory === "עיצוב" && /עיצוב|design|ui|ux|figma/i.test(titleContext)) ||
        titleContext.includes(selectedCategory);

    return matchesSearch && categoryMatch;
  });

  return (
    <div className="w-full">
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-12 gap-6 w-full">
        
        {/* Search Input Bar RTL */}
        <div className="relative w-full md:w-[400px] shrink-0 group">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            dir="rtl"
            placeholder="חיפוש קורסים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] text-white font-medium text-sm rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 block pr-12 pl-4 py-4 transition-all shadow-inner placeholder:text-slate-500"
          />
        </div>

        {/* Categories Tab Group */}
        <div className="flex flex-row-reverse flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                selectedCategory === cat 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500" 
                  : "bg-[#0f172a]/50 text-slate-400 border border-[#1e293b] hover:bg-[#1e293b] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Course Grid Mapping */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
        {filteredCourses.map((course: any) => (
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

      {/* Empty States Filter Validation */}
      {filteredCourses.length === 0 && (
          <div className="w-full py-32 text-center bg-[#0f172a]/30 rounded-3xl border border-[#1e293b] border-dashed flex flex-col items-center">
             <Filter className="w-12 h-12 text-slate-600 mb-4" />
             <h3 className="text-xl font-bold text-slate-400" dir="rtl">לא נמצאו קורסים התואמים את החיפוש.</h3>
             <button 
               onClick={() => { setSearchQuery(""); setSelectedCategory("הכל"); }} 
               className="mt-6 font-bold text-sm bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-6 py-3 rounded-xl transition-colors border border-indigo-500/20"
             >
                נקה סינונים
             </button>
          </div>
      )}
    </div>
  );
}
