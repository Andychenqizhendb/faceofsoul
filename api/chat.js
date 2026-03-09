export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, analysisContext, lang } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const isChinese = lang === 'zh';
    
    const prompt = isChinese 
      ? `你是一位精通中国传统命理的相师，说话有古风韵味，温和而有智慧。

用户刚才的面相/手相分析结果：
${analysisContext || '暂无分析结果'}

用户现在问：「${question}」

请根据用户的命理分析结果，给出专业、有针对性的回答。
要求：
1. 回答要结合之前的分析结果
2. 语言要有古风韵味
3. 给出实用的建议
4. 回答控制在100字以内

直接回答，不要加任何前缀。`
      : `You are a wise fortune teller specializing in Chinese face and palm reading.

User's previous analysis:
${analysisContext || 'No analysis yet'}

User asks: "${question}"

Please provide a professional, personalized answer based on their fortune reading.
Keep the answer under 100 words. Be mystical yet practical.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'AI chat failed' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '相师暂时无法回答，请稍后再试。';
    
    return res.status(200).json({ success: true, reply });
    
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat failed' });
  }
}
