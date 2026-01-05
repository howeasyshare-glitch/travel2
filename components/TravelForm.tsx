const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("API Key 未設定");

      // 1. 使用你代碼中指定的最新模型名稱 gemini-3-flash-preview
      const model = "gemini-3-flash-preview";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `你是一位專業旅遊規劃師。請規劃去 ${formData.location} 的 ${formData.days} 天行程。請務必只回傳純 JSON 格式：{"title":"標題","summary":"簡介","days":[{"day":1,"plan":"內容"}]}` }] 
          }],
          generationConfig: {
            // 2. 依照你提供的代碼 logic，這裡可以加入或省略 thinking_config
            // 為了讓前端顯示穩定，我們暫時不啟用 Thinking 過程，只拿結果
            responseMimeType: "application/json"
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Google API 呼叫失敗");
      }

      // 3. 解析結果
      const aiText = data.candidates[0].content.parts[0].text;
      setResult(JSON.parse(aiText));
      setStep(4);
    } catch (error: any) {
      console.error("最終診斷:", error);
      alert("AI 生成失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };
