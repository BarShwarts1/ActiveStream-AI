"use client";

import Link from "next/link";
import { BookOpen, Layers, Clock } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    created_at: string;
    lessons?: any[];
    progress?: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const lessonCount = Array.isArray(course.lessons) && course.lessons.length > 0 && typeof course.lessons[0].count === 'number' 
    ? course.lessons[0].count 
    : (Array.isArray(course.lessons) ? course.lessons.length : 0);
    
  const progress = course.progress || 0;
  const targetHref = `/courses/${course.id}`;

  return (
    <Link 
      href={targetHref}
      className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden transition-all group flex flex-col hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] cursor-pointer"
    >
      {/* Premium Abstract Cover Art */}
      <div className="w-full h-40 bg-slate-800/50 relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 end-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -me-24 -mt-24 group-hover:bg-indigo-500/30 transition-colors"></div>
        <div className="absolute bottom-0 start-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ms-16 -mb-16"></div>
        
        <div className="w-16 h-16 bg-[#1e293b] border border-slate-700 rounded-2xl flex items-center justify-center z-10 shadow-xl group-hover:scale-110 transition-transform duration-500">
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              lessonCount > 0 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
          </div>
        </div>
        
        <h3 dir="rtl" className="text-lg font-black text-right text-white mb-4 line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
          {course.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between text-slate-400 text-sm font-medium">
          <div className="flex items-center">
            <Clock className="w-4 h-4 me-2" />
            {new Date(course.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          
          {lessonCount === 0 && (
            <span className="text-[10px] uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">Empty</span>
          )}
          
          {lessonCount > 0 && progress === 0 && (
            <span className="text-[10px] uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">START</span>
          )}

          {lessonCount > 0 && progress > 0 && (
            <span className="text-[10px] uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">IN PROGRESS</span>
          )}
        </div>
      </div>
    </Link>
  );
}
