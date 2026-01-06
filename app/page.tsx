"use client";

import React, { useState } from "react";
import { Clock, MapPin, Sparkles, Loader2, Utensils, Hotel, RefreshCw, Calendar, Users, AlertCircle } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    location: "", days: 2, adults: 2, children: 0, mustVisit: "", hotelPref: ""
  });

  const handleSubmit = async () => {
    if (!form.location) return;
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      
      // 處理可能的各種 AI 回傳情況
      let rawText = data.rawText || "";
      // 移除 Markdown 的 ```json 標籤
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      try {
        const parsedData = JSON.parse(cleanJson);
        if (parsedData.itinerary) {
          setResult(parsedData);
        } else {
          throw new Error("找不到 itinerary 欄位");
        }
      } catch (e) {
        console.error("JSON 解析失敗", cleanJson);
        setErrorMsg("AI 回傳格式不正確，請再試一次。");
      }
    } catch (error) {
      setErrorMsg("網路或伺服器錯誤。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-center mb-8">AI 客製化行程規劃</h1>

        {/* 輸入區塊 */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 mb-8 space-y-4">
          <input className="w-full p-4 bg-slate-100 rounded-xl outline-none" placeholder="目的地 (例如：大阪)" 
            value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})}/>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" className="p-4 bg-slate-100 rounded-xl outline-none" placeholder="天數" value={form.days} onChange={(e)=>setForm({...form, days:parseInt(e.target.value)})}/>
            <input type="number" className="p-4 bg-slate-100 rounded-xl outline-none" placeholder="大人" value={form.adults} onChange={(e)=>setForm({...form, adults:parseInt(e.target.value)})}/>
            <input type="number" className="p-4 bg-slate-100 rounded-xl outline-none" placeholder="小孩" value={form.children} onChange={(e)=>setForm({...form, children:parseInt(e.target.value)})}/>
          </div>
          <input className="w-full p-4 bg-slate-100 rounded-xl outline-none" placeholder="指定旅館 (選填)" value={form.hotelPref} onChange={(e)=>setForm({...form, hotelPref:e.target.value})}/>
          <textarea className="w-full p-4 bg-slate-100 rounded-xl outline-none" placeholder="必去景點 (選填)" value={form.mustVisit} onChange={(e)=>setForm({...form, mustVisit:e.target.value})}/>
          
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
            {loading ? "規劃中..." : "開始規劃"}
          </button>
        </div>

        {/* 錯誤處理 */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-2 mb-6">
            <AlertCircle size={20}/> {errorMsg}
          </div>
        )}

        {/* 渲染行程 */}
        {result?.itinerary?.map((day: any, idx: number) => (
          <div key={idx} className="mb-8 animate-in fade-in slide-in-from-bottom-3">
            <h2 className="text-2xl font-bold mb-4 px-4 border-l-4 border-blue-600">Day {day.day} - {day.date_title}</h2>
            <div className="space-y-4">
              {day.schedule?.map((item: any, sIdx: number) => (
                <div key={sIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="text-blue-600 font-bold min-w-[60px]">{item.time}</div>
                  <div>
                    <h3 className="font-bold text-lg">{item.activity}</h3>
                    <p className="text-slate-500 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
