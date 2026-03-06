export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, type, lang } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    const isChinese = lang === 'zh';
    const isFace = type === 'face';
    
    const prompt = isChinese 
      ? `你是一位精通中国传统面相学和手相学的相师。请分析这张${isFace ? '面部' : '手掌'}照片，给出详细的命理解读。

请按以下JSON格式回复：
{
  "scores": {"overall": 85, "career": 80, "wealth": 75, "love": 90, "health": 85},
  "analysis": {
    "main": "整体分析...",
    "features": [
      {"name": "${isFace ? '额头' : '生命线'}", "description": "描述..."},
      {"name": "${isFace ? '眉眼' : '智慧线'}", "description": "描述..."},
      {"name": "${isFace ? '鼻相' : '感情线'}", "description": "描述..."},
      {"name": "${isFace ? '唇相' : '事业线'}", "description": "描述..."}
    ]
  },
  "fortune": {
    "career": "事业运分析...",
    "wealth": "财运分析...",
    "love": "感情运分析...",
    "health": "健康运分析..."
  },
  "advice": ["建议1", "建议2", "建议3"]
}

请确保分析专业有深度，语言有古风韵味。评分60-95之间。`
      : `You are a master of Chinese face and palm reading. Analyze this ${isFace ? 'face' : 'palm'} photo.

Reply in JSON format:
{
  "scores": {"overall": 85, "career": 80, "wealth": 75, "love": 90, "health": 85},
  "analysis": {
    "main": "Overall analysis...",
    "features": [
      {"name": "${isFace ? 'Forehead' : 'Life Line'}", "description": "..."},
      {"name": "${isFace ? 'Eyes' : 'Head Line'}", "description": "..."},
      {"name": "${isFace ? 'Nose' : 'Heart Line'}", "description": "..."},
      {"name": "${isFace ? 'Lips' : 'Fate Line'}", "description": "..."}
    ]
  },
  "fortune": {
    "career": "Career analysis...",
    "wealth": "Wealth analysis...",
    "love": "Love analysis...",
    "health": "Health analysis..."
  },
  "advice": ["Advice 1", "Advice 2", "Advice 3"]
}`;

    // Call Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return res.status(500).json({ error: 'AI analysis failed' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysisData = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ success: true, data: analysisData });
      } catch (e) {
        return res.status(200).json({ success: true, rawText: text });
      }
    }
    
    return res.status(200).json({ success: true, rawText: text });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
}
