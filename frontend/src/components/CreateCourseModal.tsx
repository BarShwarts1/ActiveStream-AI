"use client";

import { useState, useEffect } from "react";
import { X, Layers, Loader2, CheckCircle2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setError(null);
      setIsLoading(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required.");

      const { error: insertError } = await supabase.from('courses').insert({
        title,
        description,
        teacher_id: session.user.id
      });

      if (insertError) throw insertError;

      setIsSuccess(true);
      
      setTimeout(() => {
        onClose();
        router.refresh(); // Refresh dashboard seamlessly
      }, 1000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-white font-sans">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0f172a] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden shadow-indigo-500/10">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#1e293b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Create New Course</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 hover:bg-[#1e293b] p-2 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Course Launched</h3>
              <p className="text-emerald-400 font-medium text-sm">Now available in your library.</p>
            </div>
          ) : (
            <>
              {/* Course Title */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">
                  Course Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  placeholder="כותרת הקורס (לדוגמה: מתמטיקה 5 יח״ל)"
                  dir="rtl"
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-right placeholder-slate-600"
                />
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">
                  Course Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  placeholder="תיאור קצר של מטרות הקורס וקאטגוריה..."
                  dir="rtl"
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-right placeholder-slate-600 resize-none"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          {!isSuccess && (
            <div className="pt-4 border-t border-[#1e293b] flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !title.trim() || !description.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Committing...
                  </>
                ) : (
                  <>
                    Publish Catalog
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
