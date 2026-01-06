import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, mustVisit, hotelPref } = await req.json();

    // 檢查 API Key 是否存在
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "伺服器缺少 API Key 設定" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 這是目前最穩定的名稱
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `你是一位專業導遊，請為前往 ${location} 的 ${adults}大${children}小 規劃 ${days} 天行程。
      指定景點：${mustVisit}
      住宿需求：${hotelPref}
      請回傳 JSON 格式，包含 title (字串) 和 itinerary (陣列，內含 day, date_label, schedule)。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "AI 生成失敗" }, { status: 500 });
  }
}
