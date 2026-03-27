"use client";

import React, { useState, useEffect, useRef } from "react";
import TutorCanvas from "@/components/TutorCanvas";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";

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
  
  const [chatMinimized, setChatMinimized] = useState(false);

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
    setChatMinimized(hasPausedForPractice);
  }, [hasPausedForPractice]);

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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLessonData();
  }, [lessonId]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isPlaying) return;
    const currentTime = e.currentTarget.currentTime;
    
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
      <main className="w-full h-screen flex flex-col items-center justify-center bg-[#020617] text-indigo-500">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-sm font-bold tracking-widest uppercase">Loading Virtual Session...</p>
      </main>
    );
  }

  if (!lessonData) {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center bg-[#020617] text-center px-4">
        <h1 className="text-3xl font-black text-white mb-2">Lesson Not Found</h1>
        <p className="text-lg text-gray-500 font-medium">This session does not exist or has been removed.</p>
      </main>
    );
  }

  return (
    <main className="w-full h-screen overflow-hidden flex bg-[#020617] text-white font-sans">
      <div className="w-16 md:w-20 bg-[#0f172a] border-r border-[#1e293b] flex flex-col items-center py-6 shrink-0 z-50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 mb-8 shadow-lg shadow-indigo-500/20 flex flex-col items-center justify-center">
          <span className="font-black text-white text-lg">A</span>
        </div>
        <div className="flex flex-col gap-6 flex-1 w-full items-center">
          <button className="p-3 text-indigo-400 bg-indigo-500/10 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button className="p-3 text-gray-500 hover:text-gray-300 hover:bg-[#1e293b] rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-[#020617]">
        <div className={`relative transition-all duration-300 ${chatMinimized ? 'w-full' : 'w-full md:w-[80%]'} h-full flex flex-col`}>
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

          {hasPausedForPractice && (
            <div className="absolute inset-0 z-20 bg-[#020617]/90 backdrop-blur-xl flex flex-col md:flex-row p-6 md:p-12 animate-in fade-in duration-500 overflow-y-auto">
              
              <div className="w-full md:w-2/3 h-[500px] md:h-full flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
                  <h3 className="font-black text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Smart Canvas
                  </h3>
                  <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase flex items-center gap-1">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                     </svg>
                     Live Sync
                  </span>
                </div>
                <div className="flex-1 relative bg-white overflow-hidden">
                  <TutorCanvas
                    roomId={lessonId}
                    isPcViewer={true}
                    activePrompt={activeStop?.prompt_text}
                    activeTimestamp={activeStop?.timestamp_seconds}
                    submitTrigger={submitTrigger}
                    onAiEvaluating={() => setIsEvaluating(true)}
                    onAiFeedbackReceived={(feedback) => {
                      setAiFeedback(feedback);
                      setIsEvaluating(false);
                    }}
                    clearTrigger={clearTrigger}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3 h-full flex flex-col pl-0 md:pl-8 pt-6 md:pt-0">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6 leading-tight flex-1">
                  {activeStop?.prompt_text}
                </h2>

                <div className="shrink-0 flex flex-col gap-4">
                  {aiFeedback ? (
                    <div className={`p-6 rounded-2xl border backdrop-blur-md ${
                        aiFeedback.status === "success" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      }`}>
                      <span className="uppercase text-[10px] tracking-widest font-black mb-2 block text-white/70">
                        {aiFeedback.status === "success" ? "Perfect!" : "Hint"}
                      </span>
                      <p className="text-sm font-medium">{aiFeedback.message}</p>
                    </div>
                  ) : isEvaluating && (
                    <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md flex items-center justify-center gap-4 text-indigo-400">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                      <span className="font-bold text-sm tracking-wide">Waiting for AI sync...</span>
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setAiFeedback({status: "success", message: "Developer Override: Success signal bypassed."})}
                      className="w-1/3 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wide bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10"
                    >
                      Skip AI
                    </button>
                    <button
                      onClick={() => {
                        setIsEvaluating(true);
                        setSubmitTrigger(prev => prev + 1);
                      }}
                      disabled={aiFeedback?.status === "success" || isEvaluating}
                      className={`w-1/3 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all border ${
                        aiFeedback?.status !== "success" && !isEvaluating
                          ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                          : "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      Submit
                    </button>
                    <button
                      disabled={aiFeedback?.status !== "success"}
                      onClick={handleContinue}
                      className={`w-1/3 py-3.5 rounded-xl font-black text-xs uppercase tracking-wide transition-all shadow-lg ${
                        aiFeedback?.status === "success"
                          ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20"
                          : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5 shadow-none"
                        }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chatMinimized && (
            <button 
              onClick={() => setChatMinimized(false)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-500 transition-all z-30 group overflow-hidden border border-indigo-400/50"
            >
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse"></span>
            </button>
          )}
        </div>

        <div className={`transition-all duration-300 ease-in-out border-l border-[#1e293b] bg-[#0f172a] flex flex-col z-10 ${chatMinimized ? 'w-0 opacity-0 overflow-hidden' : 'w-full md:w-[20%] min-w-[300px] opacity-100'}`}>
          <div className="p-4 md:p-5 border-b border-[#1e293b] flex justify-between items-center shrink-0">
            <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              <span className="text-indigo-500 bg-indigo-500/10 p-1.5 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Contextual AI Tutor
            </h3>
            {hasPausedForPractice && (
              <button onClick={() => setChatMinimized(true)} className="text-gray-500 hover:text-white transition-colors bg-[#1e293b]/50 hover:bg-[#1e293b] p-1.5 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-[11px] uppercase tracking-widest text-center text-gray-500 font-bold mt-10">
                Ask a question about the video...
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-[13px] leading-relaxed shadow-sm ${
                  m.sender === 'user' 
                    ? "bg-indigo-600 text-white rounded-br-sm" 
                    : "bg-[#1e293b] border border-[#334155] text-gray-200 rounded-bl-sm font-medium"
                }`} dir={m.sender === 'user' ? "auto" : "rtl"}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t border-[#1e293b] shrink-0 flex gap-2">
            <input
              type="text"
              dir="auto"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="שאל שאלה..."
              className="flex-1 min-w-0 bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <button type="submit" disabled={!chatInput.trim()} className="bg-indigo-600 text-white px-4 rounded-xl font-bold disabled:opacity-50 text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              <svg className="w-4 h-4 transform -rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>

          <div className="p-4 border-t border-[#1e293b] shrink-0 bg-[#0b1121]">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-gray-300 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Link iPad
              </div>
              <svg className={`w-4 h-4 transition-transform ${showQR ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showQR && (
              <div className="mt-4 flex flex-col items-center bg-[#020617] border border-[#1e293b] rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-xl">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG 
                    value={`http://${NETWORK_IP}:3000/lesson/${lessonId}/draw`} 
                    size={140} 
                    level="H" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-3 break-all text-center">
                  http://{NETWORK_IP}:3000/lesson/{lessonId}/draw
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
