"use client";

import { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export default function TravelForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. 呼叫我們之前寫好的 API 路由
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("AI 生成失敗");

      const data = await response.json();
      
      // 2. 儲存 AI 回傳的結果並跳轉到結果頁
      setResult(data); 
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("抱歉，AI 暫時連不上，請檢查 Vercel 的 API Key 設定！");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* 進度條 */}
      <div className="bg-slate-50 h-2 flex">
        <div 
          className="bg-blue-500 transition-all duration-500" 
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* 步驟 1: 地點 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 text-blue-600">
              <MapPin size={28} />
              <h2 className="text-2xl font-bold text-slate-800">你想去哪裡？</h2>
            </div>
            <input 
              type="text"
              placeholder="例如：日本東京、法國巴黎..."
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:outline-none transition-all"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <button 
              onClick={nextStep}
              disabled={!formData.location}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all"
            >
              下一步 <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* 步驟 2: 時間與人數 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 text-green-600">
              <Calendar size={28} />
              <h2 className="text-2xl font-bold text-slate-800">規劃細節</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Calendar size={14} /> 天數
                </label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl"
                  value={formData.days}
                  onChange={(e) => setFormData({...formData, days: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Users size={14} /> 人數
                </label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl"
                  value={formData.members}
                  onChange={(e) => setFormData({...formData, members: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400">返回</button>
              <button onClick={nextStep} className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 flex-[2]">下一步</button>
            </div>
          </div>
        )}

        {/* 步驟 3: 預算與確認 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 text-amber-500">
              <Wallet size={28} />
              <h2 className="text-2xl font-bold text-slate-800">最後確認</h2>
            </div>
            <select 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl appearance-none"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            >
              <option value="經濟">小資經濟 (重視性價比)</option>
              <option value="中等">標準舒適 (平衡預算與體驗)</option>
              <option value="奢華">高端奢華 (追求頂級享受)</option>
            </select>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400">返回</button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                {loading ? "AI 正在思考中..." : <><Sparkles size={20} /> 開始生成行程</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
