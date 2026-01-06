"use client";

import React, { useState } from "react";
import { Clock, MapPin, Sparkles, Loader2, Utensils, Hotel, RefreshCw, Calendar, Users } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    location: "",
    days: 2,
    adults: 2,
    children: 0,
    mustVisit: "",
    hotelPref: ""
  });

  const handleSubmit = async () => {
    if (!form.location) return;
    setLoading(true);
    setResult(null); // 清除舊結果避免干擾
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      
      // 取得 AI 的純文字內容
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // 清理 Markdown 標籤並解析 JSON
      const cleanJsonStr = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanJsonStr);
      
      setResult(parsedData);
    } catch (error) {
      console.error("解析錯誤:", error);
      alert("AI 回傳格式有誤，請再試一次！");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2">客製化行程大師</h1>
          <p className="text-slate-500 font-medium">按時間排程，隨時調整您的旅程</p>
        </header>

        {/* 輸入區 */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">目的地</label>
              <input className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all" 
                placeholder="你想去哪裡？" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})}/>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">天數 & 人數</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-100 rounded-2xl p-2 flex items-center">
                  <Calendar size={18} className="ml-2 text-slate-400"/>
                  <input type="number" className="w-full p-2 bg-transparent outline-none" value={form.days} onChange={(e)=>setForm({...form, days:parseInt(e.target.value)})}/>
                </div>
                <div className="flex-1 bg-slate-100 rounded-2xl p-2 flex items-center">
                  <Users size={18} className="ml-2 text-slate-400"/>
                  <input type="number" className="w-full p-2 bg-transparent outline-none" value={form.adults} onChange={(e)=>setForm({...form, adults:parseInt(e.target.value)})}/>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">指定旅館 / 偏好</label>
              <div className="bg-slate-100 rounded-2xl p-2 flex items-center">
                <Hotel size={18} className="ml-2 text-slate-400"/>
                <input className="w-full p-2 bg-transparent outline-none" placeholder="例如：ABC酒店" value={form.hotelPref} onChange={(e)=>setForm({...form, hotelPref:e.target.value})}/>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">一定要去的景點</label>
              <textarea className="w-full p-4 bg-slate-100 rounded-2xl outline-none min-h-[80px]" 
                placeholder="例如：東京鐵塔、雷門..." value={form.mustVisit} onChange={(e)=>setForm({...form, mustVisit:e.target.value})}/>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
              {loading ? "AI 規劃師正在排程..." : "開始規劃行程"}
            </button>
          </div>
        </div>

        {/* 行程顯示區 */}
        <div className="space-y-12">
          {result?.itinerary?.map((day: any, dIdx: number) => (
            <section key={dIdx} className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-base font-black">Day {day.day}</span>
                {day.date_title}
              </h2>
              
              <div className="space-y-6 border-l-4 border-slate-200 ml-5 pl-8">
                {day.schedule?.map((item: any, iIdx: number) => (
                  <div key={iIdx} className="relative group">
                    {/* 時間軸上的小圓點 */}
                    <div className="absolute -left-[42px] top-6 w-5 h-5 bg-white border-4 border-blue-600 rounded-full z-10"></div>
                    
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                          <Clock size={16}/>
                          {item.time}
                        </div>
                        <button className="hidden group-hover:flex items-center gap-1 text-slate-300 hover:text-blue-500 text-sm font-bold transition-colors">
                          <RefreshCw size={14}/> 更換活動
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{item.activity}</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
