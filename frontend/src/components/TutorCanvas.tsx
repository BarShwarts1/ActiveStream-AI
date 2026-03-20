"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Eraser, Pen, Trash2, Smartphone } from "lucide-react";

interface TutorCanvasProps {
  roomId: string;
  isPcViewer?: boolean;
  onHintReceived?: (hint: string) => void;
  clearTrigger?: number;
  onLinkMobileClick?: () => void;
}

export default function TutorCanvas({ roomId, isPcViewer = false, onHintReceived, clearTrigger, onLinkMobileClick }: TutorCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isEraser, setIsEraser] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isIncomingStroke = useRef<boolean>(false);
  const pathsCacheRef = useRef<any[]>([]);

  // Permanent IP Binding universally identical successfully locking mapping implicitly
  const NETWORK_IP = process.env.NEXT_PUBLIC_LOCAL_IP || "192.168.1.99";

  const getCanvasSize = () => {
    if (containerRef.current) {
      return { 
        w: containerRef.current.clientWidth || 1000, 
        h: containerRef.current.clientHeight || 1000 
      };
    }
    return { w: 1000, h: 1000 };
  };

  useEffect(() => {
    setMounted(true);
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [roomId]);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      clearCanvas();
    }
  }, [clearTrigger]);

  const connectWebSocket = useCallback(() => {
    if (!roomId) return;
    
    const socketUrl = `ws://${NETWORK_IP}:8000/ws/tutor/${roomId}`;
    const ws = new WebSocket(socketUrl);
    
    ws.onopen = () => {
      if (ws.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === "stroke") {
          const { w, h } = getCanvasSize();
          const denormalizedStroke = {
            ...msg.data,
            paths: msg.data.paths.map((p: any) => ({
              x: p.x * w,
              y: p.y * h
            }))
          };

          isIncomingStroke.current = true;
          pathsCacheRef.current = [...pathsCacheRef.current, denormalizedStroke];
          
          canvasRef.current?.loadPaths(pathsCacheRef.current);
          
          setTimeout(() => {
              isIncomingStroke.current = false;
          }, 50);
          
        } else if (msg.type === "clear") {
            isIncomingStroke.current = true;
            pathsCacheRef.current = [];
            canvasRef.current?.clearCanvas();
            setTimeout(() => { isIncomingStroke.current = false; }, 50);
        } else if (msg.type === "hint") {
            // Decoupled floating animations entirely routing generic string states explicitly to parent environments
            if (onHintReceived) {
                onHintReceived(msg.data);
            }
        }
      } catch (err) {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 3000);
    };

    ws.onerror = (err) => ws.close(); 
    wsRef.current = ws;
  }, [roomId, NETWORK_IP, onHintReceived]);

  const handlePointerDown = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handleStrokeEnd = async (stroke: any) => {
    if (isIncomingStroke.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    if (stroke) {
      pathsCacheRef.current = [...pathsCacheRef.current, stroke];

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          const rect = containerRef.current?.getBoundingClientRect();
          const w = rect?.width || 1;
          const h = rect?.height || 1;

          const normalizedStroke = {
            ...stroke,
            paths: stroke.paths.map((p: any) => ({
              x: p.x / w,
              y: p.y / h
            }))
          };

          wsRef.current.send(JSON.stringify({ 
            type: "stroke", 
            device: isPcViewer ? "PC" : "Mobile", 
            data: normalizedStroke 
          }));
        } catch (e) {}
      }
    }

    idleTimerRef.current = setTimeout(() => {
      captureAndSend();
    }, 2000);
  };

  const captureAndSend = async () => {
    if (!canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      const base64Image = await canvasRef.current.exportImage("jpeg");
      wsRef.current.send(JSON.stringify({ 
        type: "image", 
        device: isPcViewer ? "PC" : "Mobile", 
        data: base64Image 
      }));
    } catch (err) {}
  };

  const toggleEraser = () => {
    canvasRef.current?.eraseMode(!isEraser);
    setIsEraser(!isEraser);
  };

  const clearCanvas = () => {
    pathsCacheRef.current = [];
    canvasRef.current?.clearCanvas();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear" }));
    }
  };

  return (
    // Replaced absolute inset-0 sizing organically mapping explicitly purely via generic dynamic wrapping allowing native sidebar scaling constraints securely seamlessly smoothly unconditionally naturally effectively safely
    <div className="relative w-full h-full m-0 p-0 overflow-hidden flex flex-col bg-white touch-none overscroll-none select-none">
      
      <div className="shrink-0 h-[64px] bg-white border-b border-gray-200 shadow-[0_2px_5px_-1px_rgba(0,0,0,0.05)] flex items-center justify-center relative z-20 w-full px-2 flex-wrap">
        <div className="flex items-center space-x-2 mr-2 md:mr-4 border-r pr-2 md:pr-4 border-gray-100">
          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors duration-500 ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
          <span className="text-xs md:text-sm font-bold tracking-tight text-gray-700 hidden sm:inline-block">
            {isConnected ? "Active" : "Connecting..."}
          </span>
        </div>
        
        <button onClick={toggleEraser} className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all ${!isEraser ? "bg-indigo-100 text-indigo-700 font-bold shadow-inner" : "text-gray-600 hover:bg-gray-100 font-medium"}`}>
          <Pen size={16} />
          <span className="text-xs md:text-sm hidden min-[400px]:inline-block">Draw</span>
        </button>
        <button onClick={toggleEraser} className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all ${isEraser ? "bg-pink-100 text-pink-700 font-bold shadow-inner" : "text-gray-600 hover:bg-gray-100 font-medium"}`}>
          <Eraser size={16} />
          <span className="text-xs md:text-sm hidden min-[400px]:inline-block">Erase</span>
        </button>
        <button onClick={clearCanvas} className="flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 text-red-600 hover:bg-red-50 rounded-full transition-all font-medium ml-1">
          <Trash2 size={16} />
        </button>
        
        {isPcViewer && (
          <>
            <div className="w-px h-5 bg-gray-200 mx-2 hidden sm:block" />
            <button 
              onClick={onLinkMobileClick} 
              className="flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-full transition-all font-bold tracking-wide border border-indigo-100 ml-auto hidden sm:flex"
            >
              <Smartphone size={16} />
              <span className="text-xs md:text-sm">Link Mobile</span>
            </button>
          </>
        )}
      </div>



      {/* Pristine 16:9 100vh lock perfectly preventing mobile stretching bugs organically implicitly correctly optimally! */}
      <div className="flex-1 w-full bg-gray-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative touch-none">
        <div 
          ref={containerRef}
          className="bg-white shadow-[0_0_25px_rgba(0,0,0,0.06)] relative rounded-xl border border-gray-200 touch-none flex-shrink-0 overflow-hidden"
          style={{
            aspectRatio: '16/9',
            width: '100%',
            maxWidth: 'min(100%, calc((100vh - 100px) * 16/9))',
            maxHeight: '100%',
          }}
          onPointerDown={handlePointerDown}
        >
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            eraserWidth={20}
            strokeColor="#1f2937"
            canvasColor="transparent"
            className="w-full h-full block touch-none"
            style={{ border: "none", width: "100%", height: "100%" }}
            onStroke={handleStrokeEnd}
          />
        </div>
      </div>
    </div>
  );
}
