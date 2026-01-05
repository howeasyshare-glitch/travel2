"use client";

import React, { useState } from "react";
import { MapPin, Sparkles, Loader2, Plane, Calendar, RefreshCw } from "lucide-react";

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
    /* 測試點 1：bg-red-500 如果沒變紅，代表 Tailwind 沒啟動 */
    <div className="min-h-screen bg-red-500 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* 測試點 2：強制行內樣式，如果這個沒變藍色，代表 React 渲染有問題 */}
        <header className="text-center mb-10">
          <h1 style={{ color: 'blue', fontSize: '60px', fontWeight: 'bold', backgroundColor: 'yellow' }}>
            CSS 優先級測試中
          </h1>
          <p className="text-white text-2xl font-black mt-4">
            如果背景不是紅色的，代表 Tailwind 失效
          </p>
        </header>

        {/* 輸入卡片 */}
        <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-black mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                className="w-full p-4 bg-slate-200 rounded-xl text-black outline-none border-2 border-blue-500" 
                placeholder="輸入測試地點..." 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSubmit}
              className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-800"
            >
              {loading ? "連線中..." : "按下測試"}
            </button>
          </div>
        </div>

        {/* 結果顯示區 */}
        {result && (
          <div className="bg-white text-black p-8 rounded-3xl shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-red-600">{result.title}</h2>
            <div className="space-y-4">
              {result.days?.map((day: any) => (
                <div key={day.day} className="border-b-2 border-gray-100 pb-4">
                  <div className="font-bold text-blue-600 text-xl">Day {day.day}</div>
                  <p className="mt-2 text-gray-700">{day.plan}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
