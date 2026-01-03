import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, budget, members } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一位專業的旅遊規劃師。請幫我規劃一份前往 ${location} 的 ${days} 天旅遊行程。
    人數：${members} 人，預算等級：${budget}。
    請用繁體中文回答，並嚴格遵守以下 JSON 格式：
    {
      "title": "行程名稱",
      "summary": "一句話簡介",
      "days": [
        { "day": 1, "plan": "詳細行程描述" }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, ""); // 清理 Markdown 標籤
    
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "AI 生成失敗" }, { status: 500 });
  }
}
