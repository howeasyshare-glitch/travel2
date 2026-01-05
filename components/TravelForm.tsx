"use client";

import React, { useState } from "react";
// 確保你有安裝 lucide-react，如果沒有，暫時把這些 icon 刪掉
import { MapPin, Calendar, Users, Wallet, Sparkles, Loader2 } from "lucide-react";

export default function TravelForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    location: "",
    days: "3",
    members: "2",
    budget: "中等",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      // 使用你從 AI Studio 獲取的最新模型名稱
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `請規劃 ${formData.location} ${formData.days}天行程。回傳純JSON: {"title":"標題","summary":"簡介","days":[{"day":1,"plan":"內容"}]}` }] }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      setResult(JSON.parse(cleanJson));
      setStep(4);
    } catch (error: any) {
      alert("失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg text-black">
      {step < 4 ? (
        <div className="space-y-4">
          <input 
            className="w-full p-2 border" 
            placeholder="目的地" 
            value={formData.location} 
            onChange={e => setFormData({...formData, location: e.target.value})} 
          />
          <button 
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            className="w-full py-2 bg-blue-600 text-white"
          >
            {loading ? "處理中..." : step === 3 ? "開始生成" : "下一步"}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold">{result?.title}</h2>
          <button onClick={() => setStep(1)} className="mt-4 border p-2">重新開始</button>
        </div>
      )}
    </div>
  );
}
