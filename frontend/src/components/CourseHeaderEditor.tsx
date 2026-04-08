"use client";

import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface CourseHeaderEditorProps {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  children: React.ReactNode; // The static title+description view
}

export default function CourseHeaderEditor({ 
  courseId, 
  initialTitle, 
  initialDescription,
  children
}: CourseHeaderEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleSave = async () => {
    setLoading(true);
    await supabase.from("courses").update({ title, description }).eq("id", courseId);
    setLoading(false);
    setIsEditing(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsEditing(false);
  };

  if (isEditing) {
    // ── EDITING MODE: Replace the entire title+description area ──
    return (
      <div className="relative z-10 flex-1 flex flex-col items-end w-full" dir="rtl">
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          dir="rtl"
          placeholder="כותרת הקורס"
          className="w-full bg-[#0b1120] border-2 border-indigo-500/30 focus:border-indigo-500 text-white text-3xl md:text-4xl font-black px-6 py-4 rounded-2xl text-right outline-none transition-colors placeholder:text-slate-600 mb-4"
        />

        {/* Description textarea */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          dir="rtl"
          placeholder="תיאור הקורס"
          rows={4}
          className="w-full bg-[#0b1120] border-2 border-[#334155] focus:border-indigo-500/50 text-slate-300 text-lg font-medium px-6 py-4 rounded-2xl text-right outline-none transition-colors placeholder:text-slate-600 leading-relaxed resize-none mb-6"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-3 self-start">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            {loading ? "שומר..." : "שמור שינויים"}
          </button>
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 text-slate-400 hover:text-white font-medium px-4 py-3 rounded-xl text-sm transition-colors border border-[#334155] hover:border-slate-500"
          >
            <X className="w-4 h-4" />
            ביטול
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE: Show static content + Edit button ──
  return (
    <div className="relative z-10 flex-1 flex flex-col items-end text-right pt-2">
      {children}

      {/* Edit trigger */}
      <button 
        onClick={() => setIsEditing(true)}
        className="mt-6 flex items-center gap-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
      >
        <Edit2 className="w-4 h-4" />
        Edit Course Info
      </button>
    </div>
  );
}
