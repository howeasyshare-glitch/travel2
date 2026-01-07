"use client";



import React, { useState } from "react";

import { MapPin, Sparkles, Loader2, Plane, Calendar, Users, Utensils, Hotel, RefreshCw } from "lucide-react";



export default function Home() {

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);

  

  // 結構化的參數設定

  const [form, setForm] = useState({

    location: "",

    days: 3,

    adults: 2,

    children: 0,

    includeMeals: true,

    includeHotel: true

  });



  const handleSubmit = async () => {

    if (!form.location) return;

    setLoading(true);

    try {

      const response = await fetch("/api/generate", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form) // 傳送整個物件

      });

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

    <main className="min-h-screen bg-slate-50 py-12 px-4">

      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-black text-slate-900 mb-2">專業 AI 旅程助手</h1>

          <p className="text-slate-500">輸入細節，為您規劃專屬行程</p>

        </div>



        {/* 設定表單 */}

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 地點 */}

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



            {/* 天數與人數 */}

            <div>

              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">

                <Calendar size={16}/> 旅遊天數

              </label>

              <input 

                type="number" min="1" max="10"

                className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none font-medium"

                value={form.days}

                onChange={(e) => setForm({...form, days: parseInt(e.target.value)})}

              />

            </div>



            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">成人</label>

                <input type="number" className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none" 

                  value={form.adults} onChange={(e) => setForm({...form, adults: parseInt(e.target.value)})}/>

              </div>

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">小孩</label>

                <input type="number" className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none" 

                  value={form.children} onChange={(e) => setForm({...form, children: parseInt(e.target.value)})}/>

              </div>

            </div>



            {/* 輔助開關 */}

            <div className="flex gap-6 items-center pt-4">

              <label className="flex items-center gap-2 cursor-pointer">

                <input type="checkbox" checked={form.includeMeals} 

                  onChange={(e) => setForm({...form, includeMeals: e.target.checked})}

                  className="w-5 h-5 accent-blue-600" />

                <span className="font-bold text-slate-700 flex items-center gap-1"><Utensils size={16}/> 包含三餐</span>

              </label>

              <label className="flex items-center gap-2 cursor-pointer">

                <input type="checkbox" checked={form.includeHotel} 

                  onChange={(e) => setForm({...form, includeHotel: e.target.checked})}

                  className="w-5 h-5 accent-blue-600" />

                <span className="font-bold text-slate-700 flex items-center gap-1"><Hotel size={16}/> 推薦住宿</span>

              </label>

            </div>



            <button 

              onClick={handleSubmit}

              disabled={loading || !form.location}

              className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"

            >

              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}

              {loading ? "AI 正在思考最佳方案..." : "生成完整行程表"}

            </button>

          </div>

        </div>



        {/* 結果顯示 */}

        {result && (

          <div className="space-y-6">

            <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">{result.title}</h2>

            {result.days?.map((day: any) => (

              <div key={day.day} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">

                <div className="flex items-center gap-3 mb-6">

                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">DAY {day.day}</span>

                </div>

                <div className="space-y-6">

                  <div>

                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2">行程安排</h4>

                    <p className="text-slate-700 leading-relaxed">{day.plan}</p>

                  </div>

                  {day.meals && (

                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">

                      <h4 className="font-bold text-orange-700 text-sm mb-2 flex items-center gap-2"><Utensils size={16}/> 美食推薦</h4>

                      <p className="text-orange-900 text-sm italic">{day.meals}</p>

                    </div>

                  )}

                  {day.hotel && (

                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">

                      <h4 className="font-bold text-blue-700 text-sm mb-2 flex items-center gap-2"><Hotel size={16}/> 住宿建議</h4>

                      <p className="text-blue-900 text-sm">{day.hotel}</p>

                    </div>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>

  );

}
