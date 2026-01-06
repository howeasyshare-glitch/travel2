"use client";

import React, { useState } from "react";
import { Clock, Sparkles, Loader2, MapPin, Calendar, Users, Hotel, AlertCircle } from "lucide-react";

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
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // 直接檢查是否有 itinerary 欄位
      if (data.itinerary && Array.isArray(data.itinerary)) {
        setResult(data);
      } else {
        throw new Error("回傳資料結構不完整");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "發生未知錯誤，請再試一次");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* 表單區塊 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 mb-10">
          <h1 className="text-3xl font-black mb-6 text-slate-800 flex items-center gap-2">
            <Sparkles className="text-blue-600"/> 專屬行程規劃
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="md:col-span-2 p-4 bg-slate-100 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all" 
              placeholder="想去哪裡玩？" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})}/>
            
            <div className="flex gap-2">
              <input type="number" className="w-full p-4 bg-slate-100 rounded-2xl outline-none" placeholder="天數" 
                value={form.days} onChange={(e)=>setForm({...form, days:parseInt(e.target.value)})}/>
              <input type="number" className="w-full p-4 bg-slate-100 rounded-2xl outline-none" placeholder="大人" 
                value={form.adults} onChange={(e)=>setForm({...form, adults:parseInt(e.target.value)})}/>
            </div>
            
            <input className="w-full p-4 bg-slate-100 rounded-2xl outline-none" placeholder="指定飯店 (選填)" 
              value={form.hotelPref} onChange={(e)=>setForm({...form, hotelPref:e.target.value})}/>
            
            <textarea className="md:col-span-2 p-4 bg-slate-100 rounded-2xl outline-none h-24" placeholder="必去景點 (例如：迪士尼、雷門)" 
              value={form.mustVisit} onChange={(e)=>setForm({...form, mustVisit:e.target.value})}/>
            
            <button onClick={handleSubmit} disabled={loading} className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-200 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
              {loading ? "規劃中..." : "開始規劃"}
            </button>
          </div>
        </div>

        {/* 錯誤顯示 */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 mb-8 border border-red-100">
            <AlertCircle size={20}/> {errorMsg}
          </div>
        )}

        {/* 行程顯示 */}
        <div className="space-y-10">
          {result?.itinerary?.map((day: any, dIdx: number) => (
            <div key={dIdx} className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full font-black">Day {day.day}</div>
                <h2 className="text-xl font-bold text-slate-700">{day.date_title}</h2>
              </div>
              
              <div className="space-y-4 ml-6 border-l-2 border-slate-200 pl-8">
                {day.schedule?.map((item: any, iIdx: number) => (
                  <div key={iIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group">
                    <div className="absolute -left-[41px] top-6 w-4 h-4 bg-white border-2 border-blue-600 rounded-full"></div>
                    <div className="text-blue-600 font-bold text-sm mb-1 flex items-center gap-1">
                      <Clock size={14}/> {item.time}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{item.activity}</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.description}</p>
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
