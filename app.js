// AI Fortune Master - Main Application Logic

let currentMode = 'face'; // 'face' or 'palm'
let uploadedImage = null;

// DOM Elements
const mainMenu = document.getElementById('main-menu');
const analysisSection = document.getElementById('analysis-section');
const sectionTitle = document.getElementById('section-title');
const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const cameraInput = document.getElementById('camera-input');
const btnCamera = document.getElementById('btn-camera');
const btnGallery = document.getElementById('btn-gallery');
const previewImage = document.getElementById('preview-image');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const resultContent = document.getElementById('result-content');
const backBtn = document.getElementById('back-btn');
const retryBtn = document.getElementById('retry-btn');
const shareBtn = document.getElementById('share-btn');
const uploadArea = document.getElementById('upload-area');

// Event Listeners
document.getElementById('btn-face').addEventListener('click', () => startAnalysis('face'));
document.getElementById('btn-palm').addEventListener('click', () => startAnalysis('palm'));
backBtn.addEventListener('click', goBack);
uploadBox.addEventListener('click', () => fileInput.click());
btnCamera.addEventListener('click', () => cameraInput.click());
btnGallery.addEventListener('click', () => fileInput.click());
cameraInput.addEventListener('change', handleFileSelect);
fileInput.addEventListener('change', handleFileSelect);
analyzeBtn.addEventListener('click', performAnalysis);
retryBtn.addEventListener('click', resetAnalysis);
shareBtn.addEventListener('click', shareResult);

function startAnalysis(mode) {
    currentMode = mode;
    mainMenu.classList.add('hidden');
    analysisSection.classList.remove('hidden');
    
    // Update title
    const titleKey = mode === 'face' ? 'face_reading' : 'palm_reading';
    sectionTitle.setAttribute('data-i18n', titleKey);
    sectionTitle.textContent = t(titleKey);
    
    resetAnalysis();
}

function goBack() {
    analysisSection.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    resetAnalysis();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            previewImage.src = uploadedImage;
            previewImage.classList.remove('hidden');
            uploadBox.classList.add('hidden');
            analyzeBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function resetAnalysis() {
    uploadedImage = null;
    previewImage.classList.add('hidden');
    previewImage.src = '';
    uploadBox.classList.remove('hidden');
    analyzeBtn.classList.add('hidden');
    loading.classList.add('hidden');
    results.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    fileInput.value = '';
}

async function performAnalysis() {
    if (!uploadedImage) return;
    
    // Show loading
    uploadArea.classList.add('hidden');
    loading.classList.remove('hidden');
    
    try {
        // Call AI analysis
        const result = await analyzeImage(uploadedImage, currentMode);
        
        // Store analysis context for chat
        lastAnalysisResult = result;
        lastAnalysisContext = `综合运势: ${result.overall}分, 事业: ${result.scores.career}分, 财运: ${result.scores.wealth}分, 感情: ${result.scores.love}分, 健康: ${result.scores.health}分。${result.career || ''} ${result.wealth || ''}`;
        
        // Display results
        loading.classList.add('hidden');
        results.classList.remove('hidden');
        resultContent.innerHTML = formatResult(result);
        
    } catch (error) {
        console.error('Analysis failed:', error);
        loading.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        alert(currentLang === 'zh' ? '分析失败，请重试' : 'Analysis failed, please try again');
    }
}

async function analyzeImage(imageData, mode) {
    try {
        // Call real AI API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageData,
                type: mode,
                lang: currentLang
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // Format API response to match our display format
            return formatAIResponse(result.data, mode);
        } else if (result.rawText) {
            // Fallback to mock if can't parse JSON
            console.log('Raw AI response:', result.rawText);
            return mode === 'face' ? generateFaceReading() : generatePalmReading();
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('AI API error:', error);
        // Fallback to mock results
        return mode === 'face' ? generateFaceReading() : generatePalmReading();
    }
}

function formatAIResponse(data, mode) {
    const scores = data.scores || {
        career: 80,
        wealth: 75,
        love: 85,
        health: 80
    };
    
    const overall = data.scores?.overall || Math.floor((scores.career + scores.wealth + scores.love + scores.health) / 4);
    
    if (mode === 'face') {
        return {
            scores,
            overall,
            personality: data.analysis?.features?.map(f => `${f.name}：${f.description}`) || [],
            career: data.fortune?.career || '',
            wealth: data.fortune?.wealth || '',
            love: data.fortune?.love || '',
            health: data.fortune?.health || '',
            advice: data.advice || []
        };
    } else {
        return {
            scores,
            overall,
            lines: {
                life: data.analysis?.features?.[0]?.description || '',
                wisdom: data.analysis?.features?.[1]?.description || '',
                heart: data.analysis?.features?.[2]?.description || '',
                fate: data.analysis?.features?.[3]?.description || ''
            },
            career: data.fortune?.career || '',
            wealth: data.fortune?.wealth || '',
            love: data.fortune?.love || '',
            health: data.fortune?.health || '',
            advice: data.advice || []
        };
    }
}

function generateFaceReading() {
    const scores = {
        career: Math.floor(Math.random() * 30) + 70,
        wealth: Math.floor(Math.random() * 30) + 70,
        love: Math.floor(Math.random() * 30) + 70,
        health: Math.floor(Math.random() * 30) + 70
    };
    
    const overall = Math.floor((scores.career + scores.wealth + scores.love + scores.health) / 4);
    
    if (currentLang === 'zh') {
        return {
            scores,
            overall,
            personality: [
                "天庭饱满，主人聪慧机敏，思维敏捷",
                "眉清目秀，性情温和，待人诚恳",
                "鼻梁挺直，意志坚定，做事有魄力",
                "嘴角上扬，心态乐观，人缘极佳"
            ],
            career: "事业运势上扬，近期有贵人相助。适合从事需要智慧与沟通的工作，领导能力强，容易获得上级赏识。建议把握机会，勇于表现自己。",
            wealth: "财运亨通，正财稳定，偏财亦有机会。但需注意理财规划，避免冲动消费。下半年有意外之财的可能。",
            love: "桃花运旺盛，单身者近期有望遇到心仪对象。已有伴侣者感情稳定，需多花时间陪伴对方，增进感情。",
            health: "整体健康状况良好，但需注意休息，避免过度劳累。建议保持规律作息，适当运动。",
            advice: [
                "近期适合穿戴金色或黄色饰品",
                "每日清晨面向东方静心三分钟",
                "多与积极乐观的人交往",
                "数字8、9为您的幸运数字"
            ]
        };
    } else {
        return {
            scores,
            overall,
            personality: [
                "Full forehead indicates wisdom and quick thinking",
                "Clear eyebrows and bright eyes show a gentle and sincere nature",
                "Straight nose bridge suggests strong willpower and determination",
                "Upturned mouth corners reveal an optimistic attitude and good social skills"
            ],
            career: "Your career fortune is rising with helpful connections coming your way. You're suited for work requiring wisdom and communication. Your leadership ability is strong and easily recognized by superiors. Seize opportunities and don't be afraid to showcase your talents.",
            wealth: "Financial fortune is smooth with stable regular income and chances for windfall gains. However, mind your financial planning and avoid impulsive spending. Unexpected gains may come in the second half of the year.",
            love: "Romance luck is flourishing. Singles may meet someone special soon. Those in relationships have stable bonds but should spend more quality time with partners.",
            health: "Overall health is good, but rest adequately and avoid overworking. Maintain a regular schedule and exercise appropriately.",
            advice: [
                "Wear gold or yellow accessories recently",
                "Meditate facing east for 3 minutes each morning",
                "Associate with positive and optimistic people",
                "Your lucky numbers are 8 and 9"
            ]
        };
    }
}

function generatePalmReading() {
    const scores = {
        career: Math.floor(Math.random() * 30) + 70,
        wealth: Math.floor(Math.random() * 30) + 70,
        love: Math.floor(Math.random() * 30) + 70,
        health: Math.floor(Math.random() * 30) + 70
    };
    
    const overall = Math.floor((scores.career + scores.wealth + scores.love + scores.health) / 4);
    
    if (currentLang === 'zh') {
        return {
            scores,
            overall,
            lines: {
                life: "生命线深长清晰，表示生命力旺盛，身体健康，能够长寿。",
                wisdom: "智慧线纹路清晰，延伸至掌中，显示思维敏捷，分析能力强。",
                heart: "感情线弧度优美，表示感情丰富，对爱情专一忠诚。",
                fate: "事业线明显，从掌底延伸向上，预示事业顺遂，有成功之相。"
            },
            career: "手相显示您具有领导才能和商业头脑。事业线清晰有力，表示您在职场上会有所成就。近期工作运势良好，适合开展新项目。",
            wealth: "财运线明显，表示您有不错的理财能力。手掌丰厚，属于能聚财的手相。建议积极开拓收入来源，财富会稳步增长。",
            love: "感情线优美，表示您是重情重义之人。桃花运不错，感情生活幸福美满。已婚者家庭和睦，单身者近期有望觅得良缘。",
            health: "生命线深长，整体健康状况良好。但需注意心脏和肠胃方面的保养，建议定期体检。",
            advice: [
                "佩戴玉石饰品可助运势",
                "每周进行手部按摩，疏通经络",
                "保持手心温暖，促进气血运行",
                "幸运方位：东南方"
            ]
        };
    } else {
        return {
            scores,
            overall,
            lines: {
                life: "Deep and clear Life Line indicates strong vitality, good health, and longevity.",
                wisdom: "Clear Head Line extending across the palm shows quick thinking and strong analytical abilities.",
                heart: "Beautifully curved Heart Line indicates rich emotions and faithful love.",
                fate: "Clear Fate Line extending upward from palm base predicts career success."
            },
            career: "Your palm shows leadership ability and business acumen. The clear Fate Line indicates career achievements. Work fortune is good recently, suitable for starting new projects.",
            wealth: "Clear Money Line shows good financial management skills. Your palm shape can accumulate wealth. Actively develop income sources and wealth will grow steadily.",
            love: "Beautiful Heart Line shows you value relationships deeply. Romance luck is good with happy love life. Married folks have harmonious families; singles may find love soon.",
            health: "Long Life Line indicates good overall health. However, pay attention to heart and digestive health. Regular check-ups are recommended.",
            advice: [
                "Wearing jade accessories can boost fortune",
                "Give yourself hand massages weekly",
                "Keep palms warm to promote energy flow",
                "Lucky direction: Southeast"
            ]
        };
    }
}

function formatResult(result) {
    const lang = currentLang;
    
    // Score labels
    const labels = {
        career: t('career'),
        wealth: t('wealth'),
        love: t('love'),
        health: t('health')
    };
    
    let html = `
        <div class="fortune-score">
            <div class="score-item">
                <div class="score-label">${t('overall_fortune')}</div>
                <div class="score-value">${result.overall}</div>
            </div>
            <div class="score-item">
                <div class="score-label">${labels.career}</div>
                <div class="score-value">${result.scores.career}</div>
            </div>
            <div class="score-item">
                <div class="score-label">${labels.wealth}</div>
                <div class="score-value">${result.scores.wealth}</div>
            </div>
            <div class="score-item">
                <div class="score-label">${labels.love}</div>
                <div class="score-value">${result.scores.love}</div>
            </div>
        </div>
    `;
    
    // Personality or Lines section
    if (result.personality) {
        html += `<h4>${t('personality')}</h4><ul>`;
        result.personality.forEach(p => {
            html += `<li>${p}</li>`;
        });
        html += `</ul>`;
    }
    
    if (result.lines) {
        html += `<h4>${lang === 'zh' ? '手纹解读' : 'Palm Lines'}</h4>`;
        for (const [key, value] of Object.entries(result.lines)) {
            const lineNames = {
                life: lang === 'zh' ? '生命线' : 'Life Line',
                wisdom: lang === 'zh' ? '智慧线' : 'Head Line',
                heart: lang === 'zh' ? '感情线' : 'Heart Line',
                fate: lang === 'zh' ? '事业线' : 'Fate Line'
            };
            html += `<p><strong>${lineNames[key]}：</strong>${value}</p>`;
        }
    }
    
    // Detailed readings
    html += `<h4>${labels.career}</h4><p>${result.career}</p>`;
    html += `<h4>${labels.wealth}</h4><p>${result.wealth}</p>`;
    html += `<h4>${labels.love}</h4><p>${result.love}</p>`;
    html += `<h4>${t('health')}</h4><p>${result.health}</p>`;
    
    // Advice
    html += `<h4>${t('advice')}</h4><ul>`;
    result.advice.forEach(a => {
        html += `<li>${a}</li>`;
    });
    html += `</ul>`;
    
    return html;
}

function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: t('title'),
            text: currentLang === 'zh' 
                ? '我刚用 AI 相师分析了我的运势，来试试吧！' 
                : 'I just analyzed my fortune with AI Fortune Master. Try it!',
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        const text = currentLang === 'zh'
            ? 'AI 相师 - 古老智慧 × 现代科技 ' + window.location.href
            : 'AI Fortune Master - Ancient Wisdom × Modern Technology ' + window.location.href;
        navigator.clipboard.writeText(text).then(() => {
            alert(currentLang === 'zh' ? '链接已复制！' : 'Link copied!');
        });
    }
}

// Chat functionality
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

let lastAnalysisResult = null;
let lastAnalysisContext = '';

chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-typing';
    typingDiv.textContent = currentLang === 'zh' ? '相师正在思考...' : 'Master is thinking...';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // Call AI chat API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: message,
                analysisContext: lastAnalysisContext,
                lang: currentLang
            })
        });
        
        typingDiv.remove();
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.reply) {
                addChatMessage(data.reply, 'assistant');
            } else {
                addChatMessage(generateChatResponse(message), 'assistant');
            }
        } else {
            addChatMessage(generateChatResponse(message), 'assistant');
        }
    } catch (error) {
        console.error('Chat API error:', error);
        typingDiv.remove();
        addChatMessage(generateChatResponse(message), 'assistant');
    }
}

function addChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    
    const senderName = sender === 'user' ? t('you') : t('master_name');
    msgDiv.innerHTML = `<div class="sender">${senderName}</div><div>${text}</div>`;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateChatResponse(question) {
    const q = question.toLowerCase();
    
    if (currentLang === 'zh') {
        // Chinese responses
        if (q.includes('财') || q.includes('钱') || q.includes('投资')) {
            return '从你的面相来看，你有不错的财运根基。建议近期可以关注稳健型投资，避免高风险操作。下半年会有意外之财的机会，但切记不可贪心。佩戴黄水晶可以增强财运。';
        } else if (q.includes('感情') || q.includes('爱') || q.includes('婚')) {
            return '你的感情线弧度优美，显示你是重情重义之人。单身者近期桃花运不错，多参加社交活动会有收获。已有伴侣者要多花时间陪伴对方，用心经营感情。';
        } else if (q.includes('事业') || q.includes('工作') || q.includes('升职')) {
            return '从相学角度看，你天庭饱满，主贵人运强。近期事业有上升趋势，但需要保持谦逊。建议多向前辈请教，厚积薄发，年底前会有好消息。';
        } else if (q.includes('健康') || q.includes('身体')) {
            return '整体来看你的健康运势良好，但需注意休息。建议保持规律作息，适当运动。特别注意保护眼睛和肠胃。绿色食物对你有益。';
        } else if (q.includes('今年') || q.includes('运势') || q.includes('2026')) {
            return '2026年对你来说是稳中求进的一年。上半年宜守不宜攻，下半年运势回升。贵人方位在东南，幸运月份是农历六月和九月。把握机会，定能有所收获。';
        } else {
            return '这个问题很有深度。从命理角度来看，凡事顺其自然，保持积极心态最重要。你面相中透出一股坚韧之气，相信自己的判断，脚踏实地去做，自然会有好结果。还有其他想问的吗？';
        }
    } else {
        // English responses
        if (q.includes('money') || q.includes('wealth') || q.includes('invest') || q.includes('financial')) {
            return 'Based on your facial features, you have a solid foundation for wealth. Consider stable investments recently and avoid high-risk ventures. Opportunities for unexpected gains may come in the second half of the year. Wearing citrine can enhance your financial luck.';
        } else if (q.includes('love') || q.includes('relationship') || q.includes('marriage')) {
            return 'Your heart line shows you value deep connections. Singles may find romance through social activities soon. Those in relationships should spend quality time with partners. Communication is key to lasting happiness.';
        } else if (q.includes('career') || q.includes('job') || q.includes('promotion')) {
            return 'Your forehead indicates strong benefactor luck. Career prospects are rising, but stay humble. Seek advice from mentors and build steadily. Good news may come before year-end.';
        } else if (q.includes('health') || q.includes('body')) {
            return 'Overall health fortune looks good, but rest is important. Maintain regular routines and exercise moderately. Pay attention to eye and digestive health. Green vegetables are beneficial for you.';
        } else if (q.includes('year') || q.includes('fortune') || q.includes('2026')) {
            return '2026 is a year of steady progress for you. First half favors consolidation, second half brings growth. Your lucky direction is Southeast. Lucky months are the 6th and 9th lunar months. Seize opportunities wisely.';
        } else {
            return 'That\'s a thoughtful question. From a fortune-telling perspective, let things flow naturally and maintain a positive attitude. Your face shows resilience - trust your judgment and work steadily toward your goals. Anything else you\'d like to know?';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Fortune Master loaded');
});
