import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. 取得 API Key 並檢查
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ 錯誤: 找不到 GOOGLE_GENERATIVE_AI_API_KEY 環境變數");
    return NextResponse.json({ error: "伺服器 API Key 設定缺失" }, { status: 500 });
  }

  try {
    const { location, days, members, budget } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. 嘗試使用最新版的模型名稱字串 (加上 -latest 通常能解決 404)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `你是一位專業的旅遊規劃師。請為我規劃一段去 ${location} 的旅程。
    細節如下：
    - 天數：${days} 天
    - 人數：${members} 人
    - 預算等級：${budget}
    
    請務必以 JSON 格式回傳，不要包含任何 markdown 標籤（如 \`\`\`json）：
    {
      "title": "旅程標題",
      "summary": "旅程簡介",
      "days": [
        { "day": 1, "plan": "當天詳細行程描述" }
      ]
    }`;

    console.log(`🤖 正在為 ${location} 生成行程...`);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 3. 處理可能的 Markdown 標籤並解析
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.error("❌ Gemini API 發生錯誤:", error.message);
    
    // 如果還是 404，回傳更具體的建議
    if (error.message.includes("404")) {
      return NextResponse.json({ 
        error: "找不到 AI 模型 (404)", 
        details: "這通常是 API Key 的權限問題，或是模型名稱不正確。請檢查 Google AI Studio 設定。" 
      }, { status: 404 });
    }

    return NextResponse.json({ error: "AI 生成失敗", details: error.message }, { status: 500 });
  }
}
