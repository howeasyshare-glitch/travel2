import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { location, days, adults, children, includeMeals, includeHotel } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      你是一位專業的旅遊規劃專家。請為以下需求設計行程：
      - 地點：${location}
      - 天數：${days} 天
      - 成員：${adults} 位成人, ${children} 位小孩
      - 包含需求：${includeMeals ? "在地美食推薦" : "不須推薦餐飲"}、${includeHotel ? "住宿區域建議" : "不須推薦住宿"}

      請根據成員組成調整景點（如有小孩請安排親子友善景點）。
      請嚴格以 JSON 格式回傳，格式如下：
      {
        "title": "旅程標題",
        "days": [
          {
            "day": 1,
            "plan": "景點行程描述",
            "meals": "${includeMeals ? "早中晚餐推薦" : ""}",
            "hotel": "${includeHotel ? "建議住宿點" : ""}"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
