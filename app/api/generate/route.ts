import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function normalizeSpots(spots: any): string[] {
  const list = spots?.customList ?? [];
  return Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : [];
}

function paceText(pace: string) {
  if (pace === "packed") return "趕（景點多、移動緊湊、停留時間短）";
  if (pace === "relaxed") return "悠閑（留白多、停留時間長、安排寬鬆）";
  return "一般（平衡安排，彈性適中）";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { location, days, adults, children, pace, meals, hotel, spots } = body;

    if (!location || !days || !adults) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const spotsList = normalizeSpots(spots);
    const hasKids = Number(children) > 0;

    const mealsRequirement =
      meals?.mode === "custom"
        ? `使用者對餐飲的自訂需求：${meals.customText}`
        : "使用者吃的沒有想法：請推薦餐廳。每次用餐（午餐/晚餐，必要時早餐）都要提供 A/B 兩個選項。";

    const hotelRequirement =
      hotel?.mode === "custom"
        ? `使用者指定/偏好住宿：${hotel.customText}。住宿（hotel）也要提供 A/B 兩個選項（若指定旅館，A=指定旅館、B=替代方案）。`
        : "使用者未指定旅館：請建議住在市中心/交通方便區域，並提供 A/B 兩個住宿選項（可用『某區域 + 代表性旅館類型』描述）。";

    const spotsRequirement =
      spots?.mode === "custom"
        ? `使用者指定必去景點清單：${spotsList.length ? spotsList.join("、") : "（未提供）"}。請把這些景點合理分配到天數中。每個景點 block 需提供 A/B 兩個選項（A 優先使用指定景點；B 給附近替代）。`
        : "使用者未指定景點：請依地點與天數推薦景點。每個景點 block 需提供 A/B 兩個選項（附近兩種風格）。";

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
你是一位專業旅遊規劃師，請為需求產生「可編輯的時間行程表」，嚴格輸出 JSON（不要輸出多餘文字）。

【使用者需求】
- 地點：${location}
- 天數：${days} 天
- 人數：成人 ${adults}、小孩 ${children}
- 旅遊節奏：${paceText(pace)}
- 親子需求：${hasKids ? "有小孩，景點/餐廳請親子友善，避免太晚" : "無小孩，步調正常"}
- 餐飲：${mealsRequirement}
- 旅館：${hotelRequirement}
- 景點：${spotsRequirement}

【時間行程表規則】
1) 每天請產生 blocks 陣列。
   - pace=packed：每日至少 8–10 blocks（停留較短、動線緊）
   - pace=normal：每日至少 6–8 blocks（平衡）
   - pace=relaxed：每日至少 5–7 blocks（留白、停留較長）
2) 每個 block 需要 timeStart / timeEnd（HH:MM 24 小時制），同一天時間不能重疊，且合理銜接（含移動時間 move）。
3) type 只能使用以下之一：arrival | spot | meal | hotel | move | free
4) 對於 type=spot/meal/hotel：
   - 必須提供 options: [A,B] 兩個選項
   - 每個 option 需包含：label, title, place, note, score(0-100), reason
   - 並提供 selectedOption（預設選更適合使用者的那個）
   - block 的 title/place/note 請填入 selectedOption 對應的內容（方便前端直接顯示）
5) 對於 type=move/free/arrival：不需要 options。
6) Day 1 必須包含 arrival（建議開始時間即可，不要假設航班）。
7) 若使用者指定必去景點，必須出現在行程 blocks 中（在選項 A 或 title/note 清楚標示）。
8) 推薦原因要「短、具體、可理解」：例如「離前一站近」「符合親子」「熱門但避開尖峰」「價格帶」等。

【JSON 輸出格式】
{
  "title": "旅程標題",
  "assumptions": { "startTime": "HH:MM", "pace": "packed|normal|relaxed" },
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
        },
        {
          "id": "d1-b2",
          "timeStart": "11:15",
          "timeEnd": "12:30",
          "type": "meal",
          "selectedOption": "A",
          "title": "（填入 A 的 title）",
          "place": "（填入 A 的 place）",
          "note": "（填入 A 的 note）",
          "options": [
            {
              "label": "A",
              "title": "推薦餐廳：...",
              "place": "區域",
              "note": "簡短提醒",
              "score": 86,
              "reason": "為什麼推薦 A（短句）"
            },
            {
              "label": "B",
              "title": "替代餐廳：...",
              "place": "區域",
              "note": "簡短提醒",
              "score": 79,
              "reason": "為什麼推薦 B（短句）"
            }
          ]
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
