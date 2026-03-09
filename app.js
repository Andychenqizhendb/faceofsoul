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
document.getElementById('pdf-btn').addEventListener('click', exportPDF);
document.getElementById('save-img-btn').addEventListener('click', saveAsImage);

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
    generateShareCard();
}

async function generateShareCard() {
    const btn = document.getElementById('share-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span><span>生成中...</span>';
    btn.disabled = true;
    
    try {
        // Get current analysis data
        const scores = lastAnalysisResult?.scores || { career: 85, wealth: 80, love: 88, health: 82 };
        const overall = lastAnalysisResult?.overall || 84;
        const readingType = currentMode === 'face' 
            ? (currentLang === 'zh' ? '面相分析' : 'Face Reading')
            : (currentLang === 'zh' ? '手相分析' : 'Palm Reading');
        
        // Get a key insight
        const insight = lastAnalysisResult?.career?.substring(0, 50) + '...' || 
            (currentLang === 'zh' ? '事业运势上扬，近期有贵人相助...' : 'Career fortune rising...');
        
        const date = new Date().toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US');
        
        // Create share card container
        const cardContainer = document.createElement('div');
        cardContainer.id = 'share-card-container';
        cardContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        // The actual share card
        const card = document.createElement('div');
        card.id = 'share-card';
        card.style.cssText = `
            width: 340px;
            background: linear-gradient(180deg, #2D1F15 0%, #3D2A1E 50%, #2D1F15 100%);
            border-radius: 20px;
            padding: 30px 25px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,162,39,0.1);
            border: 2px solid #C9A227;
            position: relative;
            overflow: hidden;
        `;
        
        card.innerHTML = `
            <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#8B2323,#C9A227,#8B2323);"></div>
            
            <div style="text-align:center;margin-bottom:25px;">
                <div style="font-size:2.5rem;margin-bottom:10px;">🔮</div>
                <h2 style="font-family:'Ma Shan Zheng',cursive;color:#C9A227;font-size:2rem;margin:0;letter-spacing:8px;">AI 相师</h2>
                <p style="color:#C4B59D;font-size:0.85rem;margin-top:8px;">${readingType} · ${date}</p>
            </div>
            
            <div style="background:linear-gradient(135deg,rgba(139,35,35,0.2),rgba(201,162,39,0.1));border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(201,162,39,0.2);">
                <div style="text-align:center;margin-bottom:15px;">
                    <div style="font-size:0.9rem;color:#C4B59D;margin-bottom:5px;">${currentLang === 'zh' ? '综合运势' : 'Overall'}</div>
                    <div style="font-size:3rem;color:#C9A227;font-weight:bold;text-shadow:0 0 20px rgba(201,162,39,0.5);">${overall}</div>
                </div>
                <div style="display:flex;justify-content:space-around;text-align:center;">
                    <div>
                        <div style="font-size:0.75rem;color:#C4B59D;">💼 ${currentLang === 'zh' ? '事业' : 'Career'}</div>
                        <div style="font-size:1.3rem;color:#F5EDE0;font-weight:bold;">${scores.career}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#C4B59D;">💰 ${currentLang === 'zh' ? '财运' : 'Wealth'}</div>
                        <div style="font-size:1.3rem;color:#F5EDE0;font-weight:bold;">${scores.wealth}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#C4B59D;">💕 ${currentLang === 'zh' ? '感情' : 'Love'}</div>
                        <div style="font-size:1.3rem;color:#F5EDE0;font-weight:bold;">${scores.love}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:#C4B59D;">💪 ${currentLang === 'zh' ? '健康' : 'Health'}</div>
                        <div style="font-size:1.3rem;color:#F5EDE0;font-weight:bold;">${scores.health}</div>
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(245,237,224,0.05);border-radius:12px;padding:15px;margin-bottom:20px;border-left:3px solid #8B2323;">
                <p style="color:#F5EDE0;font-size:0.9rem;line-height:1.6;margin:0;font-style:italic;">"${insight}"</p>
            </div>
            
            <div style="text-align:center;padding-top:15px;border-top:1px solid rgba(201,162,39,0.2);">
                <div style="background:linear-gradient(135deg,#C9A227,#E8D48B);color:#2D1810;padding:10px 20px;border-radius:20px;display:inline-block;font-weight:bold;font-size:0.9rem;">
                    🔮 ai-fortune-master.vercel.app
                </div>
                <p style="color:#C4B59D;font-size:0.7rem;margin-top:12px;">一面见心，一掌知命 ✨</p>
            </div>
        `;
        
        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 12px;
            margin-top: 20px;
        `;
        actions.innerHTML = `
            <button id="share-card-save" style="
                flex: 1;
                padding: 14px 20px;
                background: linear-gradient(135deg, #C9A227, #E8D48B);
                border: none;
                border-radius: 25px;
                color: #2D1810;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
            ">📱 ${currentLang === 'zh' ? '保存图片' : 'Save Image'}</button>
            <button id="share-card-close" style="
                padding: 14px 20px;
                background: rgba(255,255,255,0.1);
                border: 1px solid #C9A227;
                border-radius: 25px;
                color: #C9A227;
                font-size: 1rem;
                cursor: pointer;
            ">✕</button>
        `;
        
        cardContainer.appendChild(card);
        cardContainer.appendChild(actions);
        document.body.appendChild(cardContainer);
        
        // Event listeners
        document.getElementById('share-card-close').addEventListener('click', () => {
            cardContainer.remove();
        });
        
        document.getElementById('share-card-save').addEventListener('click', async () => {
            const saveBtn = document.getElementById('share-card-save');
            saveBtn.textContent = '⏳ 生成中...';
            saveBtn.disabled = true;
            
            try {
                const canvas = await html2canvas(card, {
                    backgroundColor: '#2D1F15',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                });
                
                const dataUrl = canvas.toDataURL('image/png');
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const file = new File([blob], 'ai-xiangshi-share-' + Date.now() + '.png', { type: 'image/png' });
                
                // Try Web Share API first
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'AI 相师',
                        text: currentLang === 'zh' ? '我的运势分析结果 ✨' : 'My fortune reading ✨'
                    });
                    cardContainer.remove();
                } else {
                    // Fallback: open image in new tab
                    const w = window.open('');
                    if (w) {
                        w.document.write(`
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width">
                                <title>AI 相师 分享卡片</title>
                                <style>
                                    body { margin: 0; padding: 20px; background: #1a1008; text-align: center; }
                                    img { max-width: 100%; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
                                    p { color: #C9A227; font-family: sans-serif; margin-top: 20px; }
                                </style>
                            </head>
                            <body>
                                <img src="${dataUrl}">
                                <p>📱 ${currentLang === 'zh' ? '长按图片保存，分享到小红书/朋友圈' : 'Long press to save and share'}</p>
                            </body>
                            </html>
                        `);
                    }
                }
            } catch (err) {
                console.error('Share card save failed:', err);
                alert(currentLang === 'zh' ? '保存失败，请截图保存' : 'Save failed, please take a screenshot');
            } finally {
                saveBtn.textContent = '📱 ' + (currentLang === 'zh' ? '保存图片' : 'Save Image');
                saveBtn.disabled = false;
            }
        });
        
        // Click outside to close
        cardContainer.addEventListener('click', (e) => {
            if (e.target === cardContainer) {
                cardContainer.remove();
            }
        });
        
    } catch (err) {
        console.error('Generate share card failed:', err);
        // Fallback to simple share
        const text = currentLang === 'zh'
            ? 'AI 相师 - 一面见心，一掌知命 ' + window.location.href
            : 'AI Fortune Master ' + window.location.href;
        navigator.clipboard.writeText(text).then(() => {
            alert(currentLang === 'zh' ? '链接已复制！' : 'Link copied!');
        });
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function exportPDF() {
    const resultContent = document.getElementById('result-content').innerHTML;
    const title = currentLang === 'zh' ? 'AI 相师 - 命理分析报告' : 'AI Fortune Master - Reading Report';
    const date = new Date().toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US');
    const readingType = currentMode === 'face' 
        ? (currentLang === 'zh' ? '面相分析' : 'Face Reading')
        : (currentLang === 'zh' ? '手相分析' : 'Palm Reading');
    
    // Get uploaded image
    const imageHtml = uploadedImage 
        ? `<div class="photo-section">
            <h2>${currentLang === 'zh' ? '📷 分析照片' : '📷 Analyzed Photo'}</h2>
            <img src="${uploadedImage}" alt="Analyzed photo">
           </div>` 
        : '';
    
    // Get chat messages
    const chatMsgs = document.querySelectorAll('.chat-message');
    let chatHtml = '';
    if (chatMsgs.length > 0) {
        chatHtml = `<div class="chat-section">
            <h2>${currentLang === 'zh' ? '💬 相师问答' : '💬 Follow-up Q&A'}</h2>`;
        chatMsgs.forEach(msg => {
            const isUser = msg.classList.contains('user');
            const sender = isUser 
                ? (currentLang === 'zh' ? '你' : 'You')
                : (currentLang === 'zh' ? '相师' : 'Master');
            const text = msg.querySelector('div:last-child')?.textContent || '';
            chatHtml += `<div class="chat-msg ${isUser ? 'user' : 'master'}">
                <span class="chat-sender">${sender}：</span>${text}
            </div>`;
        });
        chatHtml += '</div>';
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Ma+Shan+Zheng&display=swap');
                
                body {
                    font-family: 'Noto Serif SC', serif;
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 40px 30px;
                    color: #2D1810;
                    line-height: 1.8;
                    background: #FFF9F0;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 3px double #8B2323;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    font-family: 'Ma Shan Zheng', cursive;
                    color: #8B2323;
                    font-size: 2.5rem;
                    margin: 0 0 10px 0;
                    letter-spacing: 8px;
                }
                
                .header .type {
                    font-family: 'Ma Shan Zheng', cursive;
                    color: #C9A227;
                    font-size: 1.3rem;
                    margin-bottom: 10px;
                }
                
                .header .date {
                    color: #6B4423;
                    font-size: 0.9rem;
                }
                
                .photo-section {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px dashed #DDD;
                }
                
                .photo-section h2 {
                    font-family: 'Ma Shan Zheng', cursive;
                    color: #8B2323;
                    font-size: 1.5rem;
                    margin-bottom: 15px;
                }
                
                .photo-section img {
                    max-width: 250px;
                    max-height: 250px;
                    border-radius: 12px;
                    border: 3px solid #C9A227;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                
                .content h4 {
                    font-family: 'Ma Shan Zheng', cursive;
                    color: #8B2323;
                    font-size: 1.3rem;
                    margin: 25px 0 12px;
                    border-left: 4px solid #8B2323;
                    padding-left: 12px;
                }
                
                .content p {
                    margin-bottom: 12px;
                    text-align: justify;
                }
                
                .content ul {
                    list-style: none;
                    padding-left: 0;
                }
                
                .content li {
                    padding: 5px 0 5px 20px;
                    position: relative;
                }
                
                .content li::before {
                    content: '◈';
                    position: absolute;
                    left: 0;
                    color: #8B2323;
                }
                
                .fortune-score {
                    display: flex;
                    justify-content: space-around;
                    margin: 25px 0;
                    padding: 20px;
                    background: linear-gradient(135deg, rgba(139, 35, 35, 0.08), rgba(201, 162, 39, 0.08));
                    border-radius: 8px;
                    border: 1px solid rgba(139, 35, 35, 0.2);
                }
                
                .score-item {
                    text-align: center;
                }
                
                .score-label {
                    font-size: 0.85rem;
                    color: #6B4423;
                    margin-bottom: 8px;
                }
                
                .score-value {
                    font-size: 1.5rem;
                    color: #8B2323;
                    font-weight: bold;
                }
                
                .chat-section {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #C9A227;
                }
                
                .chat-section h2 {
                    font-family: 'Ma Shan Zheng', cursive;
                    color: #8B2323;
                    font-size: 1.5rem;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .chat-msg {
                    padding: 12px 15px;
                    margin-bottom: 12px;
                    border-radius: 10px;
                    line-height: 1.6;
                }
                
                .chat-msg.user {
                    background: rgba(201, 162, 39, 0.15);
                    border-left: 3px solid #C9A227;
                }
                
                .chat-msg.master {
                    background: rgba(139, 35, 35, 0.1);
                    border-left: 3px solid #8B2323;
                }
                
                .chat-sender {
                    font-weight: bold;
                    color: #8B2323;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #DDD;
                    color: #999;
                    font-size: 0.8rem;
                }
                
                @media print {
                    body { background: white; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔮 ${currentLang === 'zh' ? '命理分析报告' : 'Fortune Reading Report'}</h1>
                <p class="type">${readingType}</p>
                <p class="date">${date}</p>
            </div>
            ${imageHtml}
            <div class="content">
                ${resultContent}
            </div>
            ${chatHtml}
            <div class="footer">
                <p>${currentLang === 'zh' ? 'AI 相师 · 一面见心，一掌知命' : 'AI Fortune Master · One Glance, One Heart'}</p>
                <p>ai-fortune-master.vercel.app</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    
    // Wait for fonts and image to load then print
    setTimeout(() => {
        printWindow.print();
    }, 800);
}

async function saveAsImage() {
    const btn = document.getElementById('save-img-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span><span>生成中...</span>';
    btn.disabled = true;
    
    try {
        // 直接截取页面上的 result-card
        const resultCard = document.querySelector('.result-card');
        if (!resultCard) {
            throw new Error('找不到结果卡片');
        }
        
        // 临时添加简单水印footer（不用QR避免出错）
        const watermark = document.createElement('div');
        watermark.id = 'temp-watermark';
        watermark.style.cssText = 'text-align:center;padding:20px;background:linear-gradient(135deg,#3D2A1E,#2D1F15);border-radius:0 0 16px 16px;margin-top:-10px;';
        watermark.innerHTML = `
            <div style="background:linear-gradient(135deg,#C9A227,#E8D48B);color:#2D1810;padding:12px 24px;border-radius:25px;display:inline-block;font-weight:bold;">
                🔮 ai-fortune-master.vercel.app
            </div>
            <div style="color:#C4B59D;font-size:0.75rem;margin-top:12px;">AI 相师 · 一面见心，一掌知命</div>
        `;
        resultCard.appendChild(watermark);
        
        let canvas;
        try {
            canvas = await html2canvas(resultCard, {
                backgroundColor: '#2D1F15',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
        } finally {
            watermark.remove();
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // 转换为 Blob 和 File
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'ai-xiangshi-' + Date.now() + '.png', { type: 'image/png' });
        
        // 尝试使用 Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'AI 相师',
                text: '一面见心，一掌知命'
            });
        } else {
            // 降级：打开图片页面
            const w = window.open('');
            if (w) {
                w.document.write(`<html><head><meta name="viewport" content="width=device-width"><style>body{margin:0;padding:20px;background:#1a1008;text-align:center}img{max-width:100%}p{color:#C9A227;font-family:sans-serif;margin-top:15px}</style></head><body><img src="${dataUrl}"><p>📱 长按图片保存</p></body></html>`);
            }
        }
    } catch (err) {
        console.error('保存失败:', err);
        // 降级方案：打开截图页面
        const resultHtml = document.getElementById('result-content').innerHTML;
        const date = new Date().toLocaleDateString('zh-CN');
        const type = currentMode === 'face' ? '面相分析' : '手相分析';
        
        const page = window.open('', '_blank');
        if (page) {
            page.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,sans-serif;background:#2D1F15;color:#F5EDE0;padding:20px;margin:0}
.card{background:#3D2A1E;border-radius:16px;padding:24px;max-width:400px;margin:0 auto}
.head{text-align:center;border-bottom:2px solid #C9A227;padding-bottom:16px;margin-bottom:16px}
.head h1{color:#C9A227;font-size:1.5rem;margin:8px 0}
.head p{color:#C4B59D;font-size:0.8rem}
.result{font-size:0.9rem;line-height:1.7}
.result h4{color:#C9A227;margin:16px 0 8px}
.foot{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #4A3728}
.foot .btn{background:linear-gradient(135deg,#C9A227,#E8D48B);color:#2D1810;padding:10px 20px;border-radius:20px;display:inline-block;font-weight:bold}
.foot p{color:#C4B59D;font-size:0.7rem;margin-top:10px}
.tip{background:rgba(201,162,39,0.15);color:#C9A227;text-align:center;padding:12px;border-radius:8px;margin-top:16px;font-size:0.85rem}</style></head>
<body><div class="card"><div class="head"><div style="font-size:2rem">🔮</div><h1>命理分析报告</h1><p>${type} · ${date}</p></div>
<div class="result">${resultHtml}</div>
<div class="foot"><div class="btn">🔮 ai-fortune-master.vercel.app</div><p>AI 相师 · 一面见心，一掌知命</p></div></div>
<div class="tip">📱 截图保存，分享给朋友</div></body></html>`);
            page.document.close();
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
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

// Quick suggestion buttons
document.querySelectorAll('.suggest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-q');
        chatInput.value = question;
        sendChatMessage();
        // Hide suggestions after first use
        document.getElementById('chat-suggestions').style.display = 'none';
    });
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
