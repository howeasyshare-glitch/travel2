import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 初始化 Google AI (從環境變數讀取 Key)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, members, budget } = await req.json();

    // 檢查 API Key 是否存在
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "API Key 未設定" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一位專業的旅遊規劃師。請為我規劃一段去 ${location} 的旅程。
    細節如下：
    - 天數：${days} 天
    - 人數：${members} 人
    - 預算等級：${budget}
    
    請務必以 JSON 格式回傳，格式如下：
    {
      "title": "旅程標題",
      "summary": "旅程簡介",
      "days": [
        { "day": 1, "plan": "當天詳細行程描述" }
      ]
    }
    請只回傳 JSON 字串，不要包含任何 markdown 語法 (如 \`\`\`json)。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 嘗試解析 JSON
    const travelData = JSON.parse(text);
    return NextResponse.json(travelData);

  } catch (error) {
    console.error("AI 生成錯誤:", error);
    return NextResponse.json({ error: "AI 生成失敗" }, { status: 500 });
  }
}
