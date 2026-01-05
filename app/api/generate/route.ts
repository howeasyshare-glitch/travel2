import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 從環境變數讀取 Key (這裡不需要 NEXT_PUBLIC_，更安全)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "伺服器未設定 API Key" }, { status: 500 });
  }

  try {
    const { location } = await req.json();

    // 對準你帳號專屬的 gemini-3-flash-preview
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `你是一位專業旅遊規劃師。請規劃去 ${location} 的 3 天行程。請務必只回傳純 JSON 格式：{"title":"標題","days":[{"day":1,"plan":"內容"}]}` }] 
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Google API 錯誤");

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
