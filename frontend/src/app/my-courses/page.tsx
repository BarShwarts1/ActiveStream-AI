import { BookOpen } from "lucide-react";

export default function MyCoursesPage() {
  return (
    <div className="bg-[#020617] text-white p-6 sm:p-10 min-h-full flex items-center justify-center">
      <div className="text-center mt-20">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/5">
          <BookOpen className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">My Courses</h1>
        <p className="text-slate-500 font-medium">Your enrolled courses and learning history will appear here.</p>
      </div>
    </div>
  );
}
