// Internationalization - Chinese & English
const translations = {
    zh: {
        title: "相由心生",
        subtitle: "古老智慧 × 现代科技",
        face_reading: "面相分析",
        face_desc: "上传正面照，解读五官命理",
        palm_reading: "手相分析",
        palm_desc: "拍摄手掌，探索生命线索",
        back: "返回",
        upload_hint: "点击上传或拍照",
        analyze: "开始分析",
        analyzing: "AI 正在解读命理...",
        analysis_result: "分析结果",
        try_again: "再测一次",
        share: "分享结果",
        disclaimer: "仅供娱乐参考，请理性看待",
        
        // Face reading specific
        face_instruction: "请上传一张正面清晰的照片",
        face_tip: "建议：光线充足、表情自然、五官清晰可见",
        
        // Palm reading specific
        palm_instruction: "请上传您的手掌照片",
        palm_tip: "建议：手掌平展、光线充足、纹路清晰可见",
        
        // Result labels
        overall_fortune: "综合运势",
        career: "事业运",
        wealth: "财运",
        love: "感情运",
        health: "健康运",
        personality: "性格特点",
        advice: "开运建议",
        
        // Scores
        score_excellent: "极佳",
        score_good: "良好",
        score_average: "中等",
        score_weak: "偏弱",
        
        // Chat
        ask_master: "继续问相师",
        chat_placeholder: "想了解更多？问我吧...",
        master_name: "相师",
        you: "你",
        
        // Tip
        tip_title: "觉得准？随喜打赏",
        tip_subtitle: "您的支持是相师修行的动力",
        tip_coffee: "请喝咖啡",
        tip_meal: "请吃素斋",
        tip_incense: "添香油钱",
        tip_note: "打赏纯属自愿，感恩您的善心 🙏"
    },
    en: {
        title: "FaceOfSoul",
        subtitle: "Ancient Wisdom × Modern Technology",
        face_reading: "Face Reading",
        face_desc: "Upload a photo to analyze facial features",
        palm_reading: "Palm Reading",
        palm_desc: "Capture your palm to explore life lines",
        back: "Back",
        upload_hint: "Tap to upload or take photo",
        analyze: "Start Analysis",
        analyzing: "AI is reading your fortune...",
        analysis_result: "Analysis Result",
        try_again: "Try Again",
        share: "Share Result",
        disclaimer: "For entertainment purposes only",
        
        // Face reading specific
        face_instruction: "Please upload a clear front-facing photo",
        face_tip: "Tips: Good lighting, natural expression, clear facial features",
        
        // Palm reading specific
        palm_instruction: "Please upload a photo of your palm",
        palm_tip: "Tips: Palm flat open, good lighting, clear lines visible",
        
        // Result labels
        overall_fortune: "Overall Fortune",
        career: "Career",
        wealth: "Wealth",
        love: "Love",
        health: "Health",
        personality: "Personality",
        advice: "Lucky Tips",
        
        // Scores
        score_excellent: "Excellent",
        score_good: "Good",
        score_average: "Average",
        score_weak: "Needs Attention",
        
        // Chat
        ask_master: "Ask the Master",
        chat_placeholder: "Want to know more? Ask me...",
        master_name: "Master",
        you: "You",
        
        // Tip
        tip_title: "Like your reading? Leave a tip",
        tip_subtitle: "Your support keeps the wisdom flowing",
        tip_coffee: "Buy a coffee",
        tip_meal: "Buy a meal",
        tip_incense: "Light incense",
        tip_note: "Tips are voluntary. Thank you for your kindness 🙏"
    }
};

let currentLang = 'zh';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('fortune_lang', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    // Update HTML lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

function t(key) {
    return translations[currentLang][key] || key;
}

// Initialize language from localStorage or default
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('fortune_lang') || 'zh';
    setLanguage(savedLang);
    
    // Language toggle buttons
    document.getElementById('lang-zh').addEventListener('click', () => setLanguage('zh'));
    document.getElementById('lang-en').addEventListener('click', () => setLanguage('en'));
});
