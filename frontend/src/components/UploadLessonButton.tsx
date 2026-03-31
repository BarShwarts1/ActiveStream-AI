"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import UploadLessonModal from "./UploadLessonModal";

export default function UploadLessonButton({ courseId }: { courseId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-all shadow-lg shadow-indigo-500/20"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Upload Lesson
      </button>

      <UploadLessonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        courseId={courseId}
      />
    </>
  );
}
