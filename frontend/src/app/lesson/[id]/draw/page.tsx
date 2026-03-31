"use client";

import React, { Suspense } from "react";
import TutorCanvas from "@/components/TutorCanvas";

function DrawContent({ lessonId }: { lessonId: string }) {
  if (!lessonId) {
    return (
      <main className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-bold text-center">
        <p className="text-xl text-gray-800">Invalid Lesson ID.</p>
        <p className="text-md mt-2 text-gray-500">Please scan the original active QR code directly...</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-100 touch-none overscroll-none m-0 p-0 inset-0 fixed">
      <TutorCanvas roomId={lessonId} isPcViewer={false} />
    </main>
  );
}

export default function DrawPage({ params }: { params: { lessonId: string } }) {
  const { lessonId } = params;
  
  return (
    <Suspense fallback={<main className="h-screen w-screen overflow-hidden flex items-center justify-center bg-gray-100 text-gray-600 tracking-widest font-bold text-xl touch-none">Booting Unified Native Mirror...</main>}>
      <DrawContent lessonId={lessonId} />
    </Suspense>
  );
}
