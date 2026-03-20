"use client";

import React, { useState, useEffect, useRef } from "react";
import TutorCanvas from "@/components/TutorCanvas";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";

// Next.js hydration fix: explicitly disable SSR for ReactPlayer to prevent the 'black square' mounting failure.
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasPausedForPractice, setHasPausedForPractice] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [mounted, setMounted] = useState(false);

  const NETWORK_IP = process.env.NEXT_PUBLIC_LOCAL_IP || "192.168.1.99";

  const playerRef = useRef<any>(null);

  useEffect(() => {
    setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
    setMounted(true);
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Fire precisely at 45 seconds allowing users to physically draw identically.
    if (!hasPausedForPractice && e.currentTarget.currentTime >= 45) {
      setIsPlaying(false);
      setHasPausedForPractice(true);
    }
  };

  const handleContinue = () => {
    setHint(null);
    setIsPlaying(true);
    setClearTrigger(prev => prev + 1);
  };

  if (!roomId || !mounted) return null;

  return (
    <main className="w-full h-screen overflow-hidden bg-gray-50 flex flex-col md:flex-row">
      <div className="w-full md:w-[65%] h-[40vh] md:h-full relative bg-gray-950 flex flex-col items-center justify-center border-r border-gray-800 shadow-2xl z-20 overflow-hidden">

        {!isPlaying && hasPausedForPractice && (
          <div className="absolute inset-0 z-10 bg-gray-900/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-6 tracking-tight">Time to Practice!</h2>
            <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl font-medium leading-relaxed">
              Grab your connected iPad or use your mouse to solve the exact steps presented over on the interactive whiteboard.
            </p>
            <div className="bg-indigo-600/20 text-indigo-300 font-bold px-8 py-3.5 rounded-full border border-indigo-500/30 animate-pulse shadow-lg flex items-center space-x-3">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping"></span>
              <span>Waiting for AI Evaluation & Handshake...</span>
            </div>
          </div>
        )}

        {/* The dynamic wrapper organically mounts pure structural outputs bypassing Next.js DOM execution loops safely. */}
        <div className="w-full h-full relative">
          <ReactPlayer
            ref={playerRef}
            src="https://www.youtube.com/watch?v=duOh5QX1lJA&t=1s"
            playing={isPlaying}
            controls={true}
            width="100%"
            height="100%"
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      </div>

      <div className="w-full md:w-[35%] h-[60vh] md:h-full bg-white flex flex-col relative z-10 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.03)]">

        <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0 shadow-sm z-20 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center space-x-2.5">
              <span className="bg-gradient-to-tr from-indigo-600 to-purple-600 w-2.5 h-6 rounded-full inline-block shadow-sm"></span>
              <span>ActiveStream AI</span>
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest pl-5">Virtual Session</p>
          </div>
          <div className="bg-gray-100 text-indigo-600 px-3 py-1 rounded-lg font-black text-sm tracking-widest border border-gray-200">
            {roomId}
          </div>
        </div>

        <div className={`w-full flex-1 min-h-0 relative bg-gray-50 flex items-center justify-center p-0 ${showQR ? 'hidden' : 'flex'}`}>
          <TutorCanvas
            roomId={roomId}
            isPcViewer={true}
            onHintReceived={(h) => setHint(h)}
            clearTrigger={clearTrigger}
            onLinkMobileClick={() => setShowQR(true)}
            onDeviceConnected={() => setShowQR(false)}
          />
        </div>

        <div className={`shrink-0 h-64 bg-white border-t border-gray-200 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.03)] z-30 flex-col p-6 relative ${showQR ? 'hidden' : 'flex'}`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50"></div>

          <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center">
            AI Tutor Evaluation
            {!hint && hasPausedForPractice && <span className="ml-2 w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>}
          </h3>

          <div className="flex-1 overflow-y-auto mb-5 relative">
            {hint ? (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 text-gray-800 font-bold leading-relaxed shadow-inner h-full flex items-center justify-center text-center">
                {hint}
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center px-6 text-center text-gray-400 font-medium">
                {hasPausedForPractice
                  ? "AI is securely actively scanning mathematical trajectory parameters asynchronously..."
                  : "Watch the video until the practice segment stops automatically."}
              </div>
            )}
          </div>

          <div className="flex space-x-3 w-full">
            <button
              onClick={() => setHint("Developer Override: Success signal bypassed.")}
              disabled={isPlaying}
              className={`w-1/3 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-sm ${
                !isPlaying ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200" : "opacity-0 pointer-events-none"
              }`}
            >
              Skip AI
            </button>
            <button
              disabled={!hint || isPlaying}
              onClick={handleContinue}
              className={`w-2/3 py-3.5 rounded-xl font-black tracking-wide transition-all shadow-md active:scale-[0.98] ${
                hint && !isPlaying
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg ring-4 ring-indigo-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none"
                }`}
            >
              Continue Lesson
            </button>
          </div>
        </div>

        {showQR && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white overflow-y-auto animate-in fade-in duration-300">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2 mt-2">Connect iPad</h2>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-1.5 rounded-full font-black tracking-widest text-sm mb-6 shadow-md border border-indigo-300">
              ROOM: {roomId}
            </div>
            
            <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 mb-6 shadow-sm w-full max-w-[280px] aspect-square flex items-center justify-center">
              <QRCodeSVG 
                value={`http://${NETWORK_IP}:3000/draw?room=${roomId}`} 
                size={800} 
                className="w-full h-auto max-w-full"
                level="H" 
              />
            </div>

            <div className="w-full bg-gray-50 text-gray-500 text-[10px] p-3 rounded-xl break-all border border-gray-200 text-center mb-6 font-medium shadow-inner max-w-[280px]">
              http://{NETWORK_IP}:3000/draw?room={roomId}
            </div>

            <button 
              onClick={() => setShowQR(false)}
              className="w-full max-w-[280px] py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold tracking-wide rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Back to Whiteboard
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
