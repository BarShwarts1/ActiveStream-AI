"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Eraser, Pen, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TutorCanvas() {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/tutor");
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to AI Tutor WebSocket");
    };

    ws.onmessage = (event) => {
      const message = event.data;
      if (message !== "EMPTY_RESPONSE") {
        setHint(message);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected. Reconnecting in 3s...");
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  // Handle stroke start - clear timer and hints on generic pointer down
  const handlePointerDown = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setHint(null); // Clear previous hint when they start trying again
  };

  // Called by ReactSketchCanvas when a stroke finishes
  const handleStrokeEnd = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      captureAndSend();
    }, 2000);
  };

  const captureAndSend = async () => {
    if (!canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    try {
      // Export as base64 jpeg to save bandwidth
      const base64Image = await canvasRef.current.exportImage("jpeg");
      // Send directly over WebSocket
      wsRef.current.send(base64Image);
      console.log("Canvas captured and sent to AI Tutor");
    } catch (err) {
      console.error("Failed to export/send image", err);
    }
  };

  const toggleEraser = () => {
    canvasRef.current?.eraseMode(!isEraser);
    setIsEraser(!isEraser);
  };

  const clearCanvas = () => {
    canvasRef.current?.clearCanvas();
    setHint(null);
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 border border-gray-100">
        <div className="flex items-center space-x-2 mr-4 border-r pr-4 border-gray-200">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
          <span className="text-sm font-medium text-gray-600">
            {isConnected ? "Tutor Active" : "Connecting..."}
          </span>
        </div>

        <button
          onClick={toggleEraser}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
            !isEraser ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Pen size={18} />
          <span>Draw</span>
        </button>

        <button
          onClick={toggleEraser}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
            isEraser ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Eraser size={18} />
          <span>Erase</span>
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 size={18} />
          <span>Clear</span>
        </button>
      </div>

      {/* AI Tutor Feedback Overlay */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[90%] md:w-auto"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-2xl shadow-2xl">
              <div className="bg-white rounded-xl p-6 relative">
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  ✨ AI Tutor
                </div>
                <p className="text-gray-800 font-medium text-lg leading-relaxed mt-2 text-center">
                  {hint}
                </p>
                {/* Decorative tail */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-purple-100 hidden md:block" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Canvas Window */}
      <div 
        className="flex-1 w-full relative cursor-crosshair" 
        onPointerDown={handlePointerDown}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={4}
          eraserWidth={20}
          strokeColor="#1f2937"
          canvasColor="transparent"
          className="w-full h-full"
          style={{ border: "none" }}
          onStroke={handleStrokeEnd}
        />
      </div>
    </div>
  );
}
