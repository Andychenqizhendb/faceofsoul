const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    const isChinese = lang === 'zh';
    const isFace = type === 'face';
    
    const prompt = isChinese 
      ? `你是一位精通中国传统面相学和手相学的相师。请分析这张${isFace ? '面部' : '手掌'}照片，给出详细的命理解读。

请按以下格式回复（JSON格式）：
{
  "scores": {
    "overall": 85,
    "career": 80,
    "wealth": 75,
    "love": 90,
    "health": 85
  },
  "analysis": {
    "main": "对${isFace ? '五官' : '掌纹'}的整体分析...",
    "features": [
      {"name": "${isFace ? '额头' : '生命线'}", "description": "详细描述..."},
      {"name": "${isFace ? '眉眼' : '智慧线'}", "description": "详细描述..."},
      {"name": "${isFace ? '鼻相' : '感情线'}", "description": "详细描述..."},
      {"name": "${isFace ? '唇相' : '事业线'}", "description": "详细描述..."}
    ]
  },
  "fortune": {
    "career": "事业运分析...",
    "wealth": "财运分析...",
    "love": "感情运分析...",
    "health": "健康运分析..."
  },
  "advice": ["开运建议1", "开运建议2", "开运建议3"],
  "luckyInfo": {
    "color": "幸运颜色",
    "number": "幸运数字",
    "direction": "吉利方位"
  }
}

请确保分析专业、有深度，语言优美有古风韵味。评分在60-95之间，根据实际面相/手相特征给出。`
      : `You are a master of Chinese traditional face reading and palm reading. Please analyze this ${isFace ? 'face' : 'palm'} photo and provide a detailed fortune reading.

Please respond in the following JSON format:
{
  "scores": {
    "overall": 85,
    "career": 80,
    "wealth": 75,
    "love": 90,
    "health": 85
  },
  "analysis": {
    "main": "Overall analysis of ${isFace ? 'facial features' : 'palm lines'}...",
    "features": [
      {"name": "${isFace ? 'Forehead' : 'Life Line'}", "description": "Detailed description..."},
      {"name": "${isFace ? 'Eyes' : 'Head Line'}", "description": "Detailed description..."},
      {"name": "${isFace ? 'Nose' : 'Heart Line'}", "description": "Detailed description..."},
      {"name": "${isFace ? 'Lips' : 'Fate Line'}", "description": "Detailed description..."}
    ]
  },
  "fortune": {
    "career": "Career fortune analysis...",
    "wealth": "Wealth fortune analysis...",
    "love": "Love fortune analysis...",
    "health": "Health fortune analysis..."
  },
  "advice": ["Lucky advice 1", "Lucky advice 2", "Lucky advice 3"],
  "luckyInfo": {
    "color": "Lucky color",
    "number": "Lucky number",
    "direction": "Lucky direction"
  }
}

Please ensure the analysis is professional and insightful. Scores should be between 60-95 based on actual features observed.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysisData = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ success: true, data: analysisData });
      } catch (e) {
        // If JSON parsing fails, return raw text
        return res.status(200).json({ success: true, rawText: text });
      }
    }
    
    return res.status(200).json({ success: true, rawText: text });
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
};
