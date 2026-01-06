"use client";

import React, { useState } from "react";
import { Clock, MapPin, Sparkles, Loader2, Utensils, Hotel, Plus, X } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    location: "",
    days: 2,
    adults: 2,
    children: 0,
    mustVisit: "", // 指定景點
    hotelPref: ""  // 指定旅館或需求
  });

  const handleSubmit = async () => {
    if (!form.location) return;
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(cleanJson));
    } catch (error) {
      alert("生成失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-center mb-8">客製化 AI 導遊</h1>

        {/* 輸入區 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2">想去哪裡？</label>
            <input className="w-full p-3 bg-gray-100 rounded-xl outline-none" 
              placeholder="例如：東京" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})}/>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">天數 / 人數 (大+小)</label>
            <div className="flex gap-2">
              <input type="number" className="w-1/3 p-3 bg-gray-100 rounded-xl" value={form.days} onChange={(e)=>setForm({...form, days:parseInt(e.target.value)})}/>
              <input type="number" className="w-1/3 p-3 bg-gray-100 rounded-xl" value={form.adults} onChange={(e)=>setForm({...form, adults:parseInt(e.target.value)})}/>
              <input type="number" className="w-1/3 p-3 bg-gray-100 rounded-xl" value={form.children} onChange={(e)=>setForm({...form, children:parseInt(e.target.value)})}/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">指定旅館 (或需求)</label>
            <input className="w-full p-3 bg-gray-100 rounded-xl outline-none" 
              placeholder="例如：ABC酒店 或 近車站" value={form.hotelPref} onChange={(e)=>setForm({...form, hotelPref:e.target.value})}/>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2">一定要去的景點</label>
            <textarea className="w-full p-3 bg-gray-100 rounded-xl outline-none" rows={2}
              placeholder="例如：東京鐵塔, 淺草寺 (用逗號隔開)" value={form.mustVisit} onChange={(e)=>setForm({...form, mustVisit:e.target.value})}/>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="md:col-span-2 bg-black text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
            {loading ? "規劃中..." : "生成我的專屬行程"}
          </button>
        </div>

        {/* 時間軸結果 */}
        {result && result.itinerary.map((day: any) => (
          <div key={day.day} className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">D{day.day}</span>
              {day.date_title}
            </h2>
            <div className="space-y-4 border-l-2 border-gray-200 ml-4 pl-6">
              {day.schedule.map((item: any, idx: number) => (
                <div key={idx} className="relative bg-white p-4 rounded-2xl shadow-sm border group">
                  <div className="absolute -left-[33px] top-5 w-4 h-4 bg-white border-2 border-black rounded-full"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                        <Clock size={14}/> {item.time}
                      </span>
                      <h3 className="font-bold text-lg mt-1">{item.activity}</h3>
                      <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-black">
                      <RefreshCw size={16}/>
                    </button>
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

// 這裡需要多導入一個圖示
import { RefreshCw } from "lucide-react";
