"use client";

import React, { useState } from "react";
import { MapPin, Sparkles, Loader2, Plane, Calendar, Send, RefreshCw } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [location, setLocation] = useState("");

  const handleSubmit = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });

      if (!response.ok) throw new Error("伺服器回應異常");

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(cleanJson));
    } catch (error: any) {
      alert("生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 py-12 px-4 text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <Plane size={32} className="rotate-45" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            AI 旅遊規劃師
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            讓人工智慧為您量身打造下一段難忘旅程
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-xl border border-white mb-10 overflow-hidden">
          <div className="flex items-center p-2 gap-2">
            <div className="flex-1 flex items-center bg-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 ring-blue-500 transition-all">
              <MapPin className="text-slate-400 mr-3" size={20} />
              <input 
                className="bg-transparent border-none outline-none w-full text-lg font-medium placeholder:text-slate-400" 
                placeholder="您想去哪裡探索？（例如：京都、冰島）" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !location}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "規劃中..." : "開始規劃"}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
                {result.title}
              </h2>
            </div>

            <div className="grid gap-6">
              {result.days?.map((day: any) => (
                <div key={day.day} className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black shrink-0">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        Day {day.day} 行程重點
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {day.plan}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button 
                onClick={() => {setResult(null); setLocation("");}} 
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1"
              >
                <RefreshCw size={18} />
                規劃另一段旅程
              </button>
            </div>
          </div>
        )}

      </div>

      <footer className="text-center mt-20 text-slate-400 text-sm font-medium">
        Powered by Gemini 3 Flash & Next.js 14
      </footer>
    </main>
  );
}
