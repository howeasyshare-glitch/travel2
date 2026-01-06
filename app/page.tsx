"use client";

import React, { useState } from "react";
import { MapPin, Sparkles, Loader2, Calendar, Users, Hotel, Clock, Compass } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [form, setForm] = useState({
    location: "",
    days: 3,
    adults: 2,
    children: 0,
    mustVisit: "",
    hotelPref: ""
  });

  const handleSubmit = async () => {
    if (!form.location) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error: any) {
      alert("生成失敗，請檢查 API 設定");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>
          <p className="text-slate-500">輸入特定景點與飯店，為您量身打造排程</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">探索目的地</label>
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
                <MapPin className="text-slate-400 mr-2" size={20} />
                <input 
                  className="bg-transparent w-full outline-none font-medium" 
                  placeholder="例如：東京、台南..." 
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">天數</label>
                <input type="number" className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none" 
                  value={form.days} onChange={(e) => setForm({...form, days: parseInt(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">成人</label>
                <input type="number" className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none" 
                  value={form.adults} onChange={(e) => setForm({...form, adults: parseInt(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">小孩</label>
                <input type="number" className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none" 
                  value={form.children} onChange={(e) => setForm({...form, children: parseInt(e.target.value)})}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">指定飯店需求</label>
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
                <Hotel className="text-slate-400 mr-2" size={20} />
                <input className="bg-transparent w-full outline-none font-medium text-sm" 
                  placeholder="例如：近車站的飯店" value={form.hotelPref}
                  onChange={(e) => setForm({...form, hotelPref: e.target.value})}/>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">想去的特定景點</label>
              <div className="flex items-start bg-slate-100 rounded-xl px-4 py-3">
                <Compass className="text-slate-400 mr-2 mt-1" size={20} />
                <textarea className="bg-transparent w-full outline-none font-medium text-sm h-20" 
                  placeholder="迪士尼, 淺草寺..." value={form.mustVisit}
                  onChange={(e) => setForm({...form, mustVisit: e.target.value})}/>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !form.location}
              className="md:col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "規劃中..." : "開始規劃"}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-12">
            <h2 className="text-3xl font-black text-center text-slate-800">{result.title}</h2>
            {result.itinerary?.map((day: any, dIdx: number) => (
              <div key={dIdx} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">Day {day.day}</div>
                  <h3 className="text-xl font-bold">{day.date_label}</h3>
                </div>
                <div className="ml-7 border-l-2 border-slate-200 pl-9 space-y-6">
                  {day.schedule?.map((item: any, iIdx: number) => (
                    <div key={iIdx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                        <Clock size={16} /> <span>{item.time}</span>
                      </div>
                      <h4 className="font-bold text-slate-800">{item.activity}</h4>
                      <p className="text-slate-500 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
