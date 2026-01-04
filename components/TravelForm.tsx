"use client";

import { useState } from "react";
import { MapPin, Calendar, Users, Wallet, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

export default function TravelForm() {
  // 1. 狀態定義 (確保補上之前漏掉的 setResult)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null); // 用於儲存 AI 生成的行程結果

  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  // 2. 切換步驟的邏輯
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // 3. 送出表單到 API
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("AI 生成失敗");

      const data = await response.json();
      
      // 成功獲取資料後，儲存結果並跳轉到最後一頁 (Step 4)
      setResult(data);
      setStep(4);
    } catch (error) {
      console.error("Error:", error);
      alert("抱歉，AI 規劃遇到一點問題，請檢查 Vercel 上的 API Key 設定。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      {/* 頂部進度條 */}
      <div className="bg-slate-100 h-2 flex">
        <div 
          className="bg-blue-600 transition-all duration-500" 
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* 步驟 1: 地點輸入 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-blue-600">
              <MapPin size={28} />
              <h2 className="text-2xl font-bold text-slate-800">你想去哪裡？</h2>
            </div>
            <input 
              type="text"
              placeholder="例如：京都、倫敦、台東..."
              className="w-full text-lg p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <button 
              onClick={nextStep}
              disabled={!formData.location}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg"
            >
              下一步 <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* 步驟 2: 天數與人數 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-green-600">
              <Calendar size={28} />
              <h2 className="text-2xl font-bold text-slate-800">規劃細節</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 ml-1">旅行天數</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 outline-none"
                    value={formData.days}
                    onChange={(e) => setFormData({...formData, days
