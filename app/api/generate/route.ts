import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function normalizeSpots(spots: any): string[] {
  const list = spots?.customList ?? [];
  return Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : [];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      location,
      days,
      adults,
      children,
      meals, // { mode, customText }
      hotel, // { mode, customText }
      spots, // { mode, customList }
    } = body;

    if (!location || !days || !adults) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const spotsList = normalizeSpots(spots);
    const hasKids = Number(children) > 0;

    const mealsRequirement =
      meals?.mode === "custom"
        ? `使用者對餐飲的自訂需求：${meals.customText}`
        : "使用者吃的沒有想法，請每天推薦合適餐廳（可依地區/動線安排）。";

    const hotelRequirement =
      hotel?.mode === "custom"
        ? `使用者指定/偏好住宿：${hotel.customText}`
        : "使用者未指定旅館，請建議住在市中心/交通方便區域，並在行程中安排 check-in 時段。";

    const spotsRequirement =
      spots?.mode === "custom"
        ? `使用者指定必去景點清單：${spotsList.length ? spotsList.join("、") : "（未提供）"}。請把這些景點合理分配到天數中，並搭配其他推薦景點。`
        : "使用者未指定景點，請依地點與天數推薦適合景點。";

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
你是一位專業旅遊規劃師，請為需求產生「可編輯的時間行程表」，嚴格輸出 JSON（不要輸出多餘文字）。

【使用者需求】
- 地點：${location}
- 天數：${days} 天
- 人數：成人 ${adults}、小孩 ${children}
- 親子需求：${hasKids ? "有小孩，景點與餐廳請優先親子友善、避免太晚" : "無小孩，步調正常"}
- 餐飲：${mealsRequirement}
- 旅館：${hotelRequirement}
- 景點：${spotsRequirement}

【時間行程表規則】
1) 每天請產生 blocks 陣列，包含：上午活動、午餐、下午活動、晚餐、回旅館/自由時間（至少 6–8 個 blocks/天）。
2) 每個 block 需要 timeStart / timeEnd（HH:MM 24 小時制），同一天時間不能重疊，且合理銜接。
3) type 只能使用以下之一：arrival | spot | meal | hotel | move | free
4) title 要可讀、可替換（例如：推薦餐廳：xxx / 景點：xxx / check-in：xxx）
5) place 填區域/地點（例如：淺草 / 新宿 / 市中心），note 放提醒（排隊、人潮、親子、交通）。
6) Day 1 請包含「抵達/開始玩」的 block（arrival），但不要假設航班，只要用「建議開始時間」描述即可。
7) 若使用者指定必去景點，必須出現在行程 blocks 中（title 或 note 清楚標示）。

【JSON 輸出格式】
{
  "title": "旅程標題",
  "assumptions": {
    "startTime": "建議每天開始時間（HH:MM）",
    "pace": "normal | relaxed | packed"
  },
  "days": [
    {
      "day": 1,
      "blocks": [
        {
          "id": "d1-b1",
          "timeStart": "10:30",
          "timeEnd": "11:00",
          "type": "arrival",
          "title": "抵達/開始逛：${location}",
          "place": "市中心",
          "note": "建議先放行李或從交通樞紐開始"
        }
      ]
    }
  ]
}

請嚴格只輸出 JSON。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
