"use client";

import React, { useState } from "react";
import { MapPin, Sparkles, Loader2, Calendar, Users, Hotel, Clock, Compass, AlertCircle } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [form, setForm] = useState({
    location: "",
    days: 3,
    adults: 2,
    children: 0,
    mustVisit: "", // 指定景點
    hotelPref: ""  // 指定飯店
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

        {/* 設定表單 */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 地點 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">探索目的地</label>
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-blue-500 transition-all">
                <MapPin className="text-slate-400 mr-2" size={20} />
                <input 
                  className="bg-transparent w-full outline-none font-medium" 
                  placeholder="例如：東京、台南..." 
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                />
              </div>
            </div>

            {/* 天數與人數 */}
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

            {/* 指定飯店 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">指定飯店或住宿需求</label>
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-3">
                <Hotel className="text-slate-400 mr-2" size={20} />
                <input className="bg-transparent w-full outline-none font-medium text-sm" 
                  placeholder="例如：ABC飯店 或 靠近捷運站" value={form.hotelPref}
                  onChange={(e) => setForm({...form, hotelPref: e.target.value})}/>
              </div>
            </div>

            {/* 指定景點 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">想去的特定景點 (自訂)</label>
              <div className="flex items-start bg-slate-100 rounded-xl px-4 py-3">
                <Compass className="text-slate-400 mr-2 mt-1" size={20} />
                <textarea className="bg-transparent w-full outline-none font-medium text-sm h-20" 
                  placeholder="例如：迪士尼、豪德寺、敘敘苑燒肉 (用逗號隔開)" value={form.mustVisit}
                  onChange={(e) => setForm({...form, mustVisit: e.target.value})}/>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !form.location}
              className="md:col-span-2 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
