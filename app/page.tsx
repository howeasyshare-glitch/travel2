"use client";

import React, { useState } from "react";
import { Clock, Sparkles, Loader2, Calendar, Users, Hotel, AlertCircle, MapPin, Terminal } from "lucide-react";

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
      
      // 這是為了除錯：在瀏覽器 F12 視窗可以看到回傳內容
      console.log("AI Response Data:", data);

      if (data.error) throw new Error(data.error);

      // 檢查關鍵欄位是否存在
      if (data.itinerary && Array.isArray(data.itinerary)) {
        setResult(data);
      } else {
        throw new Error("回傳格式不符合預期 (缺少 itinerary)");
      }
    } catch (error: any) {
      console.error("Catch Error:", error);
      setErrorMsg("生成失敗：可能是 API Key 無法運作或格式錯誤。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 表單區 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-blue-100 p-2 rounded-xl">
              <MapPin className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-black">AI 深度旅遊規劃</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
              placeholder="去哪裡？ (例如：宜蘭、巴黎)" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})}/>
            
            <div className="flex gap-2">
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="天數" value={form.days} onChange={(e)=>setForm({...form, days:parseInt(e.target.value)})}/>
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="人數" value={form.adults} onChange={(e)=>setForm({...form, adults:parseInt(e.target.value)})}/>
            </div>

            <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="指定飯店 (選填)" value={form.hotelPref} onChange={(e)=>setForm({...form, hotelPref:e.target.value})}/>
            
            <textarea className="md:col-span-2 p-4 bg-slate-50 rounded-2xl outline-none min-h-[100px]" placeholder="想去的景點或特別要求..." value={form.mustVisit} onChange={(e)=>setForm({...form, mustVisit:e.target.value})}/>
            
            <button onClick={handleSubmit} disabled={loading} className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-100 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
              {loading ? "正在解析地理位置與景點..." : "開始規劃"}
            </button>
          </div>
        </div>

        {/* 錯誤區 */}
        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 p-5 rounded-2xl flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={20}/> {errorMsg}
            </div>
            <p className="text-xs opacity-70 italic">提示：請確認您的 GEMINI_API_KEY 是否正確，或嘗試換一個地點測試。</p>
          </div>
        )}

        {/* 行程結果區 */}
        <div className="space-y-8">
          {result?.itinerary?.map((day: any, dIdx: number) => (
            <div key={dIdx} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
              <div className="bg-slate-900 text-white p-6">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 px-3 py-1 rounded-lg font-black">Day {day.day}</span>
                  <h2 className="text-xl font-bold">{day.date_title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {day.schedule?.map((item: any, iIdx: number) => (
                  <div key={iIdx} className="flex gap-4">
                    <div className="min-w-[70px] pt-1">
                      <span className="text-blue-600 font-black flex items-center gap-1 text-sm">
                        <Clock size={14}/> {item.time}
                      </span>
                    </div>
                    <div className="flex-1 pb-6 border-b border-slate-50 last:border-0">
                      <h3 className="font-bold text-lg text-slate-800">{item.activity}</h3>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
