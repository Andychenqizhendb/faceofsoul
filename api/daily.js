// Daily Fortune API - Generates daily fortune using AI

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
        const { date, lang = 'zh' } = req.body;
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ success: false, error: 'API key not configured' });
        }
        
        const today = new Date(date || Date.now());
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        const dateStr = today.toISOString().split('T')[0];
        
        const prompt = lang === 'zh' ? `
你是一位精通易经和传统命理的AI相师。请为${dateStr}（${dayOfWeek}）生成今日运势。

请以JSON格式返回（不要加markdown代码块）：
{
    "rating": 4,
    "good": ["适合做的事1", "适合做的事2", "适合做的事3"],
    "bad": ["不宜做的事1", "不宜做的事2"],
    "notice": "今日注意事项和运势提醒（50字以内）",
    "luckyNumber": "3, 8",
    "luckyColor": "金色",
    "luckyDirection": "东南"
}

要求：
1. rating为1-5的整数
2. good列出3件适合今天做的事
3. bad列出2件今天不宜做的事
4. notice是一段温馨有深度的提醒
5. 内容要有变化，不要每天一样
6. 参考黄历但要现代化表达
` : `
You are an AI fortune master skilled in Eastern philosophy. Generate daily fortune for ${dateStr} (${dayOfWeek}).

Return in JSON format (no markdown):
{
    "rating": 4,
    "good": ["Good thing 1", "Good thing 2", "Good thing 3"],
    "bad": ["Avoid thing 1", "Avoid thing 2"],
    "notice": "Today's advice and fortune tips (under 50 words)",
    "luckyNumber": "3, 8",
    "luckyColor": "Gold",
    "luckyDirection": "Southeast"
}

Requirements:
1. rating is 1-5 integer
2. good lists 3 favorable activities
3. bad lists 2 things to avoid
4. notice is thoughtful advice
5. Content should vary daily
6. Modern interpretation of traditional wisdom
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 500
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                return res.status(200).json({ success: true, data });
            } catch (e) {
                console.error('JSON parse error:', e);
            }
        }
        
        return res.status(200).json({ success: false, rawText: text });
        
    } catch (error) {
        console.error('Daily fortune API error:', error);
        return res.status(200).json({ success: false, error: error.message });
    }
}
