import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, budget } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一位專業的旅遊規劃師。請幫我規劃一份前往 ${location} 的 ${days} 天旅遊行程。
    預算等級為：${budget}。
    請用繁體中文回答，並以 JSON 格式回傳，結構包含：
    { "title": "行程名稱", "summary": "簡介", "days": [{ "day": 1, "plan": "內容" }] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理可能存在的 Markdown 標籤
    const jsonText = text.replace(/```json|```/g, "");
    return NextResponse.json(JSON.parse(jsonText));
  } catch (error) {
    return NextResponse.json({ error: "AI 生成失敗" }, { status: 500 });
  }
}
