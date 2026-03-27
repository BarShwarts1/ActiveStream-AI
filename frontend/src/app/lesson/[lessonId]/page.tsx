"use client";

import React, { useState, useEffect, useRef } from "react";
import TutorCanvas from "@/components/TutorCanvas";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";

// Next.js hydration fix: explicitly disable SSR for ReactPlayer to prevent the 'black square' mounting failure.
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const { lessonId } = params;

  const [isPlaying, setIsPlaying] = useState(true);
  const [hasPausedForPractice, setHasPausedForPractice] = useState(false);
  
  const [activeStop, setActiveStop] = useState<any>(null);
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());

  const [aiFeedback, setAiFeedback] = useState<{status: string, message: string} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [submitTrigger, setSubmitTrigger] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [mounted, setMounted] = useState(false);

  const chatWsRef = useRef<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [lessonData, setLessonData] = useState<any>(null);
  const [smartStops, setSmartStops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const NETWORK_IP = process.env.NEXT_PUBLIC_LOCAL_IP || "192.168.1.99";

  const playerRef = useRef<any>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://${NETWORK_IP}:8000/ws/tutor/${lessonId}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "chat_response") {
          setChatMessages(prev => [...prev, { sender: 'ai', text: msg.text }]);
        }
      } catch (e) {}
    };
    chatWsRef.current = ws;
    return () => ws.close();
  }, [lessonId, NETWORK_IP]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    setMounted(true);
    
    const fetchLessonData = async () => {
      try {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (lessonError) {
            console.error(lessonError);
            setIsLoading(false);
            return;
        }

        const { data: stops, error: stopsError } = await supabase
          .from('smart_stops')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('timestamp_seconds', { ascending: true });

        if (!stopsError && stops) {
            setSmartStops(stops);
        }
        
        setLessonData(lesson);
      } catch (err) {
        console.error("Failed to load lesson data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLessonData();
  }, [lessonId]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isPlaying) return;
    const currentTime = e.currentTarget.currentTime;
    
    // Dynamic Smart Stop trigger bounds checking continuously exactly universally successfully safely explicitly seamlessly
    const stopToTrigger = smartStops.find(
      (stop) => currentTime >= stop.timestamp_seconds && currentTime <= stop.timestamp_seconds + 3 && !completedStops.has(stop.id)
    );

    if (stopToTrigger && !hasPausedForPractice) {
      setIsPlaying(false);
      setActiveStop(stopToTrigger);
      setHasPausedForPractice(true);
    }
  };

  const handleContinue = () => {
    setAiFeedback(null);
    setIsEvaluating(false);
    setClearTrigger(prev => prev + 1);
    
    if (activeStop) {
      setCompletedStops(prev => {
        const next = new Set(prev);
        next.add(activeStop.id);
        return next;
      });
      setActiveStop(null);
    }
    
    setHasPausedForPractice(false);
    
    setTimeout(() => {
        setIsPlaying(true);
    }, 50);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatWsRef.current) return;
    const time = playerRef.current?.getCurrentTime() || 0;
    
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    
    chatWsRef.current.send(JSON.stringify({
      type: "chat_message",
      text: chatInput,
      timestamp: time
    }));
    setChatInput("");
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-sm font-bold tracking-widest uppercase">Loading Virtual Session...</p>
      </main>
    );
  }

  if (!lessonData) {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <h1 className="text-3xl font-black text-gray-800 mb-2">Lesson Not Found</h1>
        <p className="text-lg text-gray-500 font-medium">This session does not exist or has been removed.</p>
      </main>
    );
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-gray-50 flex flex-col md:flex-row">
      <div className="w-full md:w-[55%] h-[40vh] md:h-full relative bg-gray-950 flex flex-col items-center justify-center border-r border-gray-800 shadow-2xl z-20 overflow-hidden">

        {!isPlaying && hasPausedForPractice && (
          <div className="absolute inset-0 z-10 bg-gray-900/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-6 tracking-tight">
              {activeStop?.prompt_text || "Time to Practice!"}
            </h2>
            <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl font-medium leading-relaxed">
              Grab your connected iPad or use your mouse to solve the exact steps presented over on the interactive whiteboard.
            </p>
            <div className="bg-indigo-600/20 text-indigo-300 font-bold px-8 py-3.5 rounded-full border border-indigo-500/30 animate-pulse shadow-lg flex items-center space-x-3">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping"></span>
              <span>Waiting for AI Evaluation & Handshake...</span>
            </div>
          </div>
        )}

        <div className="w-full h-full relative">
          <ReactPlayer
            ref={playerRef}
            src={lessonData.video_url}
            playing={isPlaying}
            controls={true}
            width="100%"
            height="100%"
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      </div>

      <div className="w-full md:w-[20%] h-[30vh] md:h-full bg-white border-r border-gray-200 flex flex-col relative z-15 shadow-inner">
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 shrink-0">
          <h3 className="text-sm font-black text-indigo-800 tracking-wide flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Hebrew AI Chat
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {chatMessages.length === 0 && (
            <div className="text-xs text-center text-gray-400 font-medium mt-10">
              Ask a question about the video...
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3 py-2 rounded-2xl max-w-[90%] text-sm ${
                m.sender === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm font-medium"
              }`} dir={m.sender === 'user' ? "auto" : "rtl"}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
          <input
            type="text"
            dir="auto"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="שאל שאלה..."
            className="flex-1 min-w-0 bg-gray-100 border-transparent rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" disabled={!chatInput.trim()} className="bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold disabled:opacity-50 text-sm">
            Send
          </button>
        </form>
      </div>

      <div className="w-full md:w-[25%] h-[60vh] md:h-full bg-white flex flex-col relative z-10 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.03)]">

        <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0 shadow-sm z-20 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center space-x-2.5">
              <span className="bg-gradient-to-tr from-indigo-600 to-purple-600 w-2.5 h-6 rounded-full inline-block shadow-sm"></span>
              <span>ActiveStream AI</span>
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest pl-5">{lessonData.title}</p>
          </div>
          <div className="bg-gray-100 text-indigo-600 px-3 py-1 rounded-lg font-black text-xs tracking-widest border border-gray-200">
            {lessonId}
          </div>
        </div>

        <div className={`w-full flex-1 min-h-0 relative bg-gray-50 flex items-center justify-center p-0 ${showQR ? 'hidden' : 'flex'}`}>
          <TutorCanvas
            roomId={lessonId}
            isPcViewer={true}
            activePrompt={activeStop?.prompt_text}
            submitTrigger={submitTrigger}
            onAiEvaluating={() => setIsEvaluating(true)}
            onAiFeedbackReceived={(feedback) => {
              setAiFeedback(feedback);
              setIsEvaluating(false);
            }}
            clearTrigger={clearTrigger}
            onLinkMobileClick={() => setShowQR(true)}
            onDeviceConnected={() => setShowQR(false)}
          />
        </div>

        <div className={`shrink-0 h-64 bg-white border-t border-gray-200 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.03)] z-30 flex-col p-6 relative ${showQR ? 'hidden' : 'flex'}`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50"></div>

          <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center">
            AI Tutor Evaluation
            {!aiFeedback && hasPausedForPractice && <span className="ml-2 w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>}
          </h3>

          <div className="flex-1 overflow-y-auto mb-5 relative">
            {isEvaluating ? (
              <div className="border rounded-2xl p-5 font-bold leading-relaxed shadow-inner h-full flex flex-col items-center justify-center text-center bg-indigo-50/50 border-indigo-200 text-indigo-800">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-3"></div>
                <span className="uppercase text-[10px] tracking-widest font-black text-indigo-500 mb-1">Evaluating</span>
                <p className="text-xs mt-1 opacity-80 font-medium">Waiting for AI sync...</p>
              </div>
            ) : aiFeedback ? (
              <div className={`border rounded-2xl p-5 font-bold leading-relaxed shadow-inner h-full flex flex-col items-center justify-center text-center ${
                  aiFeedback.status === "success" 
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                    : "bg-indigo-50/50 border-indigo-200 text-indigo-800"
                }`}>
                <span className={`uppercase text-[10px] tracking-widest mb-2 font-black ${aiFeedback.status === 'success' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                   {aiFeedback.status === "success" ? "Perfect!" : "Hint"}
                </span>
                <p className="text-sm">{aiFeedback.message}</p>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center px-6 text-center text-gray-400 font-medium">
                {hasPausedForPractice
                  ? `Prompt: "${activeStop?.prompt_text}"`
                  : "Watch the video until the practice segment stops automatically."}
              </div>
            )}
          </div>

          <div className="flex space-x-3 w-full">
            <button
              onClick={() => setAiFeedback({status: "success", message: "Developer Override: Success signal bypassed."})}
              disabled={isPlaying}
              className={`w-1/4 px-2 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all shadow-sm ${
                !isPlaying ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200" : "opacity-0 pointer-events-none"
              }`}
            >
              Skip AI
            </button>
            <button
              onClick={() => {
                setIsEvaluating(true);
                setSubmitTrigger(prev => prev + 1);
              }}
              disabled={isPlaying || aiFeedback?.status === "success" || isEvaluating}
              className={`w-1/4 px-2 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all shadow-sm whitespace-nowrap overflow-hidden text-ellipsis ${
                !isPlaying && aiFeedback?.status !== "success" && !isEvaluating
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none pointer-events-none"
              }`}
            >
              Submit PC
            </button>
            <button
              disabled={aiFeedback?.status !== "success" || isPlaying}
              onClick={handleContinue}
              className={`w-1/2 py-3.5 px-2 rounded-xl font-black tracking-wide text-xs transition-all shadow-md active:scale-[0.98] ${
                aiFeedback?.status === "success" && !isPlaying
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg ring-4 ring-emerald-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none pointer-events-none"
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
              LESSON: {lessonId}
            </div>
            
            <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 mb-6 shadow-sm w-full max-w-[280px] aspect-square flex items-center justify-center">
              <QRCodeSVG 
                value={`http://${NETWORK_IP}:3000/lesson/${lessonId}/draw`} 
                size={800} 
                className="w-full h-auto max-w-full"
                level="H" 
              />
            </div>

            <div className="w-full bg-gray-50 text-gray-500 text-[10px] p-3 rounded-xl break-all border border-gray-200 text-center mb-6 font-medium shadow-inner max-w-[280px]">
              http://{NETWORK_IP}:3000/lesson/{lessonId}/draw
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
