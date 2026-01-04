import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { location, days, members, budget } = await req.json();
    
    // 嘗試不同的模型名稱順序，解決 404 問題
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    let lastError = null;

    for (const name of modelNames) {
      try {
        console.log(`📡 嘗試使用模型: ${name}`);
        const model = genAI.getGenerativeModel({ model: name });
        
        const prompt = `你是一位旅遊規劃師。請為我規劃 ${location} ${days}天 ${members}人的 ${budget} 旅程。
        請務必只回傳純 JSON 格式（不要 Markdown 標籤）：
        {
          "title": "標題",
          "summary": "簡介",
          "days": [{ "day": 1, "plan": "行程" }]
        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return NextResponse.json(JSON.parse(cleanJson));
        
      } catch (err: any) {
        console.warn(`❌ 模型 ${name} 失敗: ${err.message}`);
        lastError = err;
        continue; // 嘗試下一個模型
      }
    }

    throw lastError; // 如果全部都失敗，拋出最後一個錯誤

  } catch (error: any) {
    console.error("終極錯誤日誌:", error);
    return NextResponse.json({ 
      error: "所有 AI 模型均無法呼叫", 
      details: error.message 
    }, { status: 500 });
  }
}
