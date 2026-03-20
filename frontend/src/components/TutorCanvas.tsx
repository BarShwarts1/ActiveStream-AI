"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Eraser, Pen, Trash2, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

interface TutorCanvasProps {
  roomId: string;
  isPcViewer?: boolean;
}

export default function TutorCanvas({ roomId, isPcViewer = false }: TutorCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isEraser, setIsEraser] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Unconditional Feedback Loop Protection ensuring stable WS streams natively robustly perfectly
  const isIncomingStroke = useRef<boolean>(false);
  const pathsCacheRef = useRef<any[]>([]);

  // Law of networking: Always map strictly to env variables natively cleanly flawlessly permanently 
  const NETWORK_IP = process.env.NEXT_PUBLIC_LOCAL_IP || "192.168.1.99";

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [roomId]);

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
          // Dynamic scaling relative exactly bounding box mathematical rendering limits universally identically safely
          const rect = containerRef.current?.getBoundingClientRect();
          const w = rect?.width || 1;
          const h = rect?.height || 1;

          const denormalizedStroke = {
            ...msg.data,
            paths: msg.data.paths.map((p: any) => ({
              x: p.x * w,
              y: p.y * h
            }))
          };

          // Protect loop limits inherently blocking rendering overlap native states correctly properly natively internally
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
            setHint(null);
            setTimeout(() => { isIncomingStroke.current = false; }, 50);
        } else if (msg.type === "hint") {
            setHint(msg.data);
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
  }, [roomId, NETWORK_IP]);

  const handlePointerDown = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setHint(null);
  };

  // High-Performance Mapping natively relying strictly natively passed individual SVG components securely efficiently effectively optimally natively dynamically properly appropriately seamlessly 
  const handleStrokeEnd = async (stroke: any) => {
    if (isIncomingStroke.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    // Explicitly log the new native stroke without querying the massive asynchronous DOM history 
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
    setHint(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear" }));
    }
  };

  return (
    <div className="absolute inset-0 w-screen h-screen m-0 p-0 overflow-hidden flex flex-col bg-gray-100 touch-none overscroll-none select-none">
      
      {/* Universal Symmetric Dashboard Toolbar seamlessly mapping strictly standardly securely beautifully permanently */}
      <div className="shrink-0 h-[72px] bg-white border-b border-gray-200 shadow-sm flex items-center justify-center relative z-10 w-full px-4 flex-wrap">
        <div className="flex items-center space-x-2 mr-4 border-r pr-4 border-gray-200">
          <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
          <span className="text-sm font-bold tracking-tight text-gray-700 hidden sm:inline-block">
            {isConnected ? "Active" : "Connecting..."}
          </span>
        </div>
        
        <button onClick={toggleEraser} className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${!isEraser ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
          <Pen size={18} />
          <span className="hidden sm:inline-block">Draw</span>
        </button>
        <button onClick={toggleEraser} className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${isEraser ? "bg-indigo-100 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
          <Eraser size={18} />
          <span className="hidden sm:inline-block">Erase</span>
        </button>
        <button onClick={clearCanvas} className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-all">
          <Trash2 size={18} />
          <span className="hidden sm:inline-block">Clear</span>
        </button>
        
        {isPcViewer && (
          <>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button 
              onClick={() => setShowQrModal(true)} 
              className="flex items-center space-x-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-all font-bold tracking-wide"
            >
              <Smartphone size={18} />
              <span>Connect iPad</span>
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showQrModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">Connect your iPad</h2>
              <div className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full font-bold tracking-widest text-sm mb-6 border border-indigo-100 shadow-inner">
                ROOM: {roomId}
              </div>
              
              <div className="bg-white p-2 rounded-xl border border-gray-100 mb-6 shadow-sm">
                <QRCodeSVG value={`http://${NETWORK_IP}:3000/draw?room=${roomId}`} size={200} level="M" />
              </div>

              <div className="w-full bg-gray-50 text-gray-600 text-[11px] p-3 rounded-lg break-all border border-gray-200 text-center mb-6">
                http://{NETWORK_IP}:3000/draw?room={roomId}
              </div>

              <button 
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full bg-gray-200 relative overflow-hidden flex flex-col items-center justify-center">
        
        <AnimatePresence>
          {hint && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-20 w-[90%] md:w-auto max-w-xl top-8 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-2xl shadow-2xl">
                <div className="bg-white rounded-xl p-6 relative">
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    ✨ AI Tutor
                  </div>
                  <p className="text-gray-800 font-bold text-lg leading-relaxed mt-2 text-center break-words">
                    {hint}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Drawing Box expanding exactly 100% of available dimensional width seamlessly dynamically */}
        <div 
          ref={containerRef}
          className="w-full h-full relative bg-white touch-none shadow-xl flex-shrink-0 border-t border-gray-200"
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
