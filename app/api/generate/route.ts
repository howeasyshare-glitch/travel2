import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. 初始化，並加入錯誤檢查
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    // 檢查 API Key
    if (!apiKey) {
      console.error("錯誤: 找不到 API Key");
      return NextResponse.json({ error: "API Key 未設定" }, { status: 500 });
    }

    const { location, days, members, budget } = await req.json();

    // 2. 嘗試使用 'gemini-1.5-flash' 的完整名稱
    // 如果依然報 404，請嘗試改回 "gemini-1.5-flash" 或 "gemini-1.5-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一位專業的旅遊規劃師。請為我規劃一段去 ${location} 的旅程。
    細節如下：
    - 天數：${days} 天
    - 人數：${members} 人
    - 預算等級：${budget}
    
    請務必以 JSON 格式回傳，格式如下（請確保 JSON 語法正確）：
    {
      "title": "旅程標題",
      "summary": "旅程簡介",
      "days": [
        { "day": 1, "plan": "當天詳細行程描述" }
      ]
    }
    請只回傳 JSON 字串，不要包含任何 \`\`\`json 等標籤。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. 強化解析邏輯，防止 AI 回傳多餘文字
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const travelData = JSON.parse(cleanText);
      return NextResponse.json(travelData);
    } catch (parseError) {
      console.error("JSON 解析失敗，原始文字:", text);
      return NextResponse.json({ error: "AI 回傳格式錯誤" }, { status: 500 });
    }

  } catch (error: any) {
    // 這裡會捕捉到你剛才看到的 404 錯誤
    console.error("Gemini API 詳細錯誤:", error);
    
    // 如果是 404 且提示模型找不到，建議用戶檢查 API Key 是否為最新的
    return NextResponse.json({ 
      error: "AI 模型呼叫失敗", 
      details: error.message 
    }, { status: 500 });
  }
}
