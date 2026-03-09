// Simple local server for testing
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;

// Load Gemini API key
let GEMINI_API_KEY = '';
try {
  GEMINI_API_KEY = fs.readFileSync('C:\\Users\\andyq\\.openclaw\\secrets\\gemini_api_key', 'utf8').trim();
} catch (e) {
  console.error('Could not load Gemini API key:', e.message);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { image, type, lang } = JSON.parse(body);
        
        if (!image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No image provided' }));
          return;
        }

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

        console.log('Calling Gemini API...');
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AI analysis failed' }));
          return;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('Gemini response received');
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const analysisData = JSON.parse(jsonMatch[0]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: analysisData }));
            return;
          } catch (e) {
            console.log('JSON parse failed, returning raw text');
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, rawText: text }));
        
      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { question, analysisContext, lang } = JSON.parse(body);
        
        const prompt = lang === 'zh'
          ? `你是一位相师，用户之前的分析结果是：${analysisContext || '暂无'}。用户问：${question}。请用专业且有古风韵味的语言回答，简洁但有深度。`
          : `You are a fortune master. The user's previous analysis: ${analysisContext || 'None'}. User asks: ${question}. Answer professionally and concisely.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, reply }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Chat failed' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🔮 AI Fortune Master running at http://localhost:${PORT}`);
  console.log(`Gemini API: ${GEMINI_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
});
