/**
 * Multilingual NLP Symptom Extraction Engine for Sehat Saathi
 * 
 * Uses keyword-based NLP with multilingual symptom dictionaries.
 * Works client-side — no external API needed.
 * Supports: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada
 */

// =================== SYMPTOM DICTIONARY ===================
// Each symptom has: id, category, severity weight, and multilingual keywords
const SYMPTOM_DB = [
  // CRITICAL symptoms (weight 8-10)
  {
    id: 'chest_pain', category: 'cardiac', weight: 9, critical: true,
    keywords: {
      en: ['chest pain', 'chest tightness', 'heart pain', 'heart attack', 'angina', 'chest burning'],
      hi: ['छाती में दर्द', 'सीने में दर्द', 'छाती में जलन', 'दिल का दौरा', 'हार्ट अटैक', 'सीना दर्द'],
      ta: ['நெஞ்சு வலி', 'மாரடைப்பு', 'இதய வலி'],
      te: ['ఛాతీ నొప్పి', 'గుండె పోటు', 'గుండె నొప్పి'],
      bn: ['বুকে ব্যথা', 'হার্ট এটাক', 'বুকে জ্বালা'],
      mr: ['छातीत दुखणे', 'हृदयविकाराचा झटका', 'छातीत जळजळ'],
    }
  },
  {
    id: 'breathing_difficulty', category: 'respiratory', weight: 9, critical: true,
    keywords: {
      en: ['difficulty breathing', 'cant breathe', 'breathless', 'shortness of breath', 'suffocating', 'gasping', 'choking'],
      hi: ['सांस लेने में तकलीफ', 'सांस फूलना', 'सांस नहीं आ रही', 'दम घुटना', 'सांस की तकलीफ', 'सांस की परेशानी'],
      ta: ['மூச்சு திணறல்', 'மூச்சு விடுவது கஷ்டம்', 'சுவாசிக்க முடியவில்லை'],
      te: ['శ్వాస తీసుకోవడం కష్టం', 'ఊపిరి ఆడటం లేదు', 'ఊపిరి తీసుకోలేకపోతున్నాను'],
      bn: ['শ্বাস নিতে কষ্ট', 'শ্বাসকষ্ট', 'দম আটকে যাচ্ছে'],
      mr: ['श्वास घेण्यास त्रास', 'दम लागणे', 'श्वास लागणे'],
    }
  },
  {
    id: 'unconscious', category: 'neurological', weight: 10, critical: true,
    keywords: {
      en: ['unconscious', 'fainted', 'passed out', 'collapsed', 'seizure', 'convulsion', 'fits'],
      hi: ['बेहोश', 'बेहोशी', 'गिर गया', 'मिर्गी', 'दौरा पड़ना', 'चक्कर खाकर गिर'],
      ta: ['மயக்கம்', 'சுயநினைவு இல்லை', 'வலிப்பு'],
      te: ['స్పృహ తప్పింది', 'మూర్ఛ', 'కళ్ళు తిరుగుతున్నాయి'],
      bn: ['অজ্ঞান', 'মূর্ছা', 'পড়ে গেছে'],
      mr: ['बेशुद्ध', 'मूर्छा', 'भोवळ'],
    }
  },
  {
    id: 'severe_bleeding', category: 'trauma', weight: 9, critical: true,
    keywords: {
      en: ['bleeding', 'blood', 'cut deep', 'heavy bleeding', 'hemorrhage', 'blood loss'],
      hi: ['खून बह रहा', 'बहुत खून', 'खून का बहना', 'गहरा कट', 'रक्तस्राव'],
      ta: ['இரத்தம் வருகிறது', 'அதிக இரத்தப்போக்கு'],
      te: ['రక్తం వస్తోంది', 'ఎక్కువ రక్తస్రావం'],
      bn: ['রক্ত পড়ছে', 'রক্তক্ষরণ'],
      mr: ['रक्तस्राव', 'रक्त वाहत आहे'],
    }
  },
  
  // HIGH SEVERITY symptoms (weight 5-7)
  {
    id: 'high_fever', category: 'infection', weight: 6,
    keywords: {
      en: ['high fever', 'very high temperature', 'burning fever', '103 fever', '104 fever', 'severe fever'],
      hi: ['तेज बुखार', 'बहुत बुखार', 'ज्यादा बुखार', 'तेज ताप', 'बदन तप रहा'],
      ta: ['அதிக காய்ச்சல்', 'கடுமையான காய்ச்சல்'],
      te: ['తీవ్రమైన జ్వరం', 'ఎక్కువ జ్వరం'],
      bn: ['তীব্র জ্বর', 'খুব জ্বর'],
      mr: ['खूप ताप', 'तीव्र ताप'],
    }
  },
  {
    id: 'fever', category: 'infection', weight: 4,
    keywords: {
      en: ['fever', 'temperature', 'warm body', 'chills', 'shivering', 'body hot'],
      hi: ['बुखार', 'ताप', 'ठंड लग रही', 'कंपकंपी', 'शरीर गर्म'],
      ta: ['காய்ச்சல்', 'உடல் சூடு', 'குளிர்'],
      te: ['జ్వరం', 'వేడి', 'చలి'],
      bn: ['জ্বর', 'শরীর গরম', 'কাঁপুনি'],
      mr: ['ताप', 'अंग गरम', 'थंडी वाजणे'],
    }
  },
  {
    id: 'severe_pain', category: 'pain', weight: 7,
    keywords: {
      en: ['severe pain', 'unbearable pain', 'extreme pain', 'worst pain', 'very painful', 'agonizing', 'excruciating'],
      hi: ['असहनीय दर्द', 'बहुत तेज दर्द', 'भयंकर दर्द', 'बहुत ज्यादा दर्द', 'तड़प रहा'],
      ta: ['கடுமையான வலி', 'தாங்க முடியாத வலி'],
      te: ['తీవ్రమైన నొప్పి', 'భరించలేని నొప్పి'],
      bn: ['তীব্র ব্যথা', 'অসহ্য ব্যথা'],
      mr: ['तीव्र वेदना', 'असह्य दुखणे'],
    }
  },
  {
    id: 'vomiting', category: 'gastro', weight: 5,
    keywords: {
      en: ['vomiting', 'nausea', 'throwing up', 'puking', 'feeling sick', 'want to vomit'],
      hi: ['उल्टी', 'जी मिचलाना', 'मतली', 'कै', 'उबकाई'],
      ta: ['வாந்தி', 'குமட்டல்'],
      te: ['వాంతులు', 'వికారం'],
      bn: ['বমি', 'বমি বমি ভাব'],
      mr: ['उलटी', 'मळमळ'],
    }
  },
  {
    id: 'diarrhea', category: 'gastro', weight: 5,
    keywords: {
      en: ['diarrhea', 'loose motion', 'watery stool', 'loose stool', 'bloody stool', 'running stomach'],
      hi: ['दस्त', 'लूज मोशन', 'पतले दस्त', 'पेट चल रहा', 'टट्टी में खून'],
      ta: ['வயிற்றுப்போக்கு', 'பேதி'],
      te: ['విరేచనాలు', 'లూజ్ మోషన్'],
      bn: ['পাতলা পায়খানা', 'ডায়রিয়া'],
      mr: ['जुलाब', 'पातळ शौच'],
    }
  },
  
  // MODERATE symptoms (weight 3-5)
  {
    id: 'headache', category: 'neurological', weight: 3,
    keywords: {
      en: ['headache', 'head pain', 'migraine', 'head hurts', 'head pounding'],
      hi: ['सिर दर्द', 'सिर में दर्द', 'माइग्रेन', 'सिर भारी'],
      ta: ['தலைவலி', 'தலையில் வலி'],
      te: ['తలనొప్పి', 'తల నొప్పి'],
      bn: ['মাথাব্যথা', 'মাথা ধরেছে'],
      mr: ['डोकेदुखी', 'डोके दुखतंय'],
    }
  },
  {
    id: 'stomach_pain', category: 'gastro', weight: 4,
    keywords: {
      en: ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache', 'cramps', 'tummy pain'],
      hi: ['पेट दर्द', 'पेट में दर्द', 'पेट में मरोड़', 'पेट में ऐंठन', 'तबीयत खराब'],
      ta: ['வயிற்றுவலி', 'வயிறு வலி'],
      te: ['కడుపు నొప్పి', 'పొట్ట నొప్పి'],
      bn: ['পেট ব্যথা', 'পেটে ব্যথা'],
      mr: ['पोटदुखी', 'पोटात दुखतंय'],
    }
  },
  {
    id: 'cough', category: 'respiratory', weight: 3,
    keywords: {
      en: ['cough', 'coughing', 'dry cough', 'wet cough', 'sore throat', 'cold'],
      hi: ['खांसी', 'सूखी खांसी', 'बलगम', 'गला दर्द', 'गले में खराश', 'सर्दी', 'जुकाम'],
      ta: ['இருமல்', 'தொண்டை வலி', 'சளி'],
      te: ['దగ్గు', 'గొంతు నొప్పి', 'జలుబు'],
      bn: ['কাশি', 'গলা ব্যথা', 'সর্দি'],
      mr: ['खोकला', 'घसा दुखणे', 'सर्दी'],
    }
  },
  {
    id: 'body_pain', category: 'pain', weight: 3,
    keywords: {
      en: ['body pain', 'joint pain', 'muscle pain', 'back pain', 'body ache', 'leg pain', 'arm pain', 'knee pain'],
      hi: ['शरीर दर्द', 'बदन दर्द', 'जोड़ों का दर्द', 'कमर दर्द', 'मांसपेशी दर्द', 'घुटने दर्द', 'टांग दर्द', 'हाथ दर्द'],
      ta: ['உடல் வலி', 'மூட்டு வலி', 'முதுகு வலி'],
      te: ['ఒళ్ళు నొప్పి', 'కీళ్ల నొప్పి', 'నడుము నొప్పి'],
      bn: ['শরীর ব্যথা', 'জয়েন্ট পেইন', 'গাঁটে ব্যথা'],
      mr: ['अंगदुखी', 'सांधेदुखी', 'कंबरदुखी'],
    }
  },
  {
    id: 'weakness', category: 'general', weight: 3,
    keywords: {
      en: ['weakness', 'fatigue', 'tired', 'no energy', 'exhausted', 'lethargic', 'dizzy', 'giddiness'],
      hi: ['कमजोरी', 'थकान', 'ताकत नहीं', 'चक्कर', 'सुस्ती', 'कमज़ोर'],
      ta: ['சோர்வு', 'பலவீனம்', 'தலைச்சுற்றல்'],
      te: ['అలసట', 'బలహీనం', 'తలతిరుగుతోంది'],
      bn: ['দুর্বলতা', 'ক্লান্তি', 'মাথা ঘুরছে'],
      mr: ['अशक्तपणा', 'थकवा', 'चक्कर येणे'],
    }
  },
  {
    id: 'skin_rash', category: 'dermatological', weight: 3,
    keywords: {
      en: ['rash', 'itching', 'skin rash', 'hives', 'red skin', 'bumps', 'allergy skin', 'eczema'],
      hi: ['चकत्ते', 'खुजली', 'दाने', 'त्वचा पर लाल', 'फुंसी', 'एलर्जी'],
      ta: ['அரிப்பு', 'தோல் அலர்ஜி', 'தடிப்பு'],
      te: ['దద్దుర్లు', 'దురద', 'చర్మం ఎర్రగా'],
      bn: ['চুলকানি', 'ফুসকুড়ি', 'র‍্যাশ'],
      mr: ['पुरळ', 'खाज', 'त्वचेवर लालसर'],
    }
  },
  {
    id: 'eye_problem', category: 'ophtha', weight: 3,
    keywords: {
      en: ['eye pain', 'blurry vision', 'red eye', 'eye swelling', 'vision problem', 'cant see properly'],
      hi: ['आंखों में दर्द', 'धुंधला दिखना', 'आंख लाल', 'आंख सूजना', 'नजर कमजोर'],
      ta: ['கண் வலி', 'கண் சிவப்பு', 'பார்வை மங்கல்'],
      te: ['కంటి నొప్పి', 'కంటి ఎర్రబడటం', 'చూపు సరిగ్గా రావడం లేదు'],
      bn: ['চোখে ব্যথা', 'চোখ লাল', 'ঝাপসা দেখা'],
      mr: ['डोळ्यात दुखणे', 'डोळे लाल', 'अंधुक दिसणे'],
    }
  },
  {
    id: 'swelling', category: 'inflammation', weight: 4,
    keywords: {
      en: ['swelling', 'swollen', 'puffiness', 'inflammation', 'edema', 'bloated'],
      hi: ['सूजन', 'फूलना', 'फूला हुआ', 'सूजा हुआ'],
      ta: ['வீக்கம்', 'வீங்கியிருக்கிறது'],
      te: ['వాపు', 'ఉబ్బడం'],
      bn: ['ফোলা', 'ফুলে গেছে'],
      mr: ['सूज', 'सुजलेले'],
    }
  },
  {
    id: 'urinary', category: 'uro', weight: 4,
    keywords: {
      en: ['painful urination', 'burning urine', 'frequent urination', 'blood in urine', 'uti'],
      hi: ['पेशाब में जलन', 'बार-बार पेशाब', 'पेशाब में खून', 'पेशाब में दर्द'],
      ta: ['சிறுநீர் கழிக்கும்போது வலி', 'அடிக்கடி சிறுநீர்'],
      te: ['మూత్రం లో మంట', 'తరచుగా మూత్రం'],
      bn: ['প্রস্রাবে জ্বালা', 'বারবার প্রস্রাব'],
      mr: ['लघवीत जळजळ', 'वारंवार लघवी'],
    }
  },
  {
    id: 'pregnancy_issue', category: 'obstetric', weight: 7,
    keywords: {
      en: ['pregnant', 'pregnancy pain', 'labor pain', 'water broke', 'pregnancy bleeding', 'contractions'],
      hi: ['प्रेग्नेंसी', 'गर्भवती', 'प्रसव पीड़ा', 'पानी की थैली फट गई', 'गर्भावस्था में खून'],
      ta: ['கர்ப்ப வலி', 'பிரசவ வலி'],
      te: ['గర్భం నొప్పి', 'ప్రసవ నొప్పి'],
      bn: ['গর্ভাবস্থায় ব্যথা', 'প্রসব ব্যথা'],
      mr: ['गरोदर वेदना', 'प्रसूती कळा'],
    }
  },
];

// =================== DURATION KEYWORDS ===================
const DURATION_KEYWORDS = {
  hours: {
    en: ['hours', 'hour', 'just now', 'today', 'since morning', 'since evening', 'few hours'],
    hi: ['घंटे', 'अभी', 'आज', 'सुबह से', 'शाम से', 'कुछ घंटे'],
    ta: ['மணி நேரம்', 'இன்று', 'இப்போது'],
    te: ['గంటలు', 'ఇప్పుడు', 'ఈరోజు'],
    bn: ['ঘণ্টা', 'আজ', 'এখন'],
    mr: ['तास', 'आज', 'आत्ता'],
  },
  days: {
    en: ['days', 'day', 'yesterday', 'since yesterday', 'two days', '2 days', '3 days'],
    hi: ['दिन', 'कल से', 'दो दिन', 'तीन दिन', 'परसों से'],
    ta: ['நாள்', 'நேற்று', 'இரண்டு நாள்'],
    te: ['రోజులు', 'నిన్నటి నుండి', 'రెండు రోజులు'],
    bn: ['দিন', 'গতকাল থেকে', 'দুই দিন'],
    mr: ['दिवस', 'कालपासून', 'दोन दिवस'],
  },
  week: {
    en: ['week', 'weeks', 'last week', 'one week', 'two weeks', '7 days'],
    hi: ['हफ्ता', 'सप्ताह', 'पिछले हफ्ते', 'एक हफ्ते'],
    ta: ['வாரம்', 'கடந்த வாரம்'],
    te: ['వారం', 'గత వారం'],
    bn: ['সপ্তাহ', 'গত সপ্তাহ'],
    mr: ['आठवडा', 'मागील आठवडा'],
  },
  month: {
    en: ['month', 'months', 'long time', 'last month', 'chronic', 'always', 'since long'],
    hi: ['महीना', 'लंबे समय', 'पिछले महीने', 'काफी दिन', 'हमेशा', 'बहुत दिन'],
    ta: ['மாதம்', 'நீண்ட காலம்'],
    te: ['నెల', 'చాలా కాలంగా'],
    bn: ['মাস', 'দীর্ঘদিন'],
    mr: ['महिना', 'खूप दिवस'],
  },
};

// =================== SEVERITY MODIFIERS ===================
const SEVERITY_MODIFIERS = {
  high: {
    en: ['very', 'extremely', 'severe', 'terrible', 'unbearable', 'worst', 'horrible', 'acute', 'intense', 'major', 'strong', 'critical'],
    hi: ['बहुत', 'भयंकर', 'तेज', 'ज्यादा', 'असहनीय', 'गंभीर', 'बहुत ज्यादा'],
    ta: ['மிகவும்', 'கடுமையான', 'அதிகமான'],
    te: ['చాలా', 'తీవ్రమైన', 'ఎక్కువగా'],
    bn: ['খুব', 'তীব্র', 'অত্যন্ত'],
    mr: ['खूप', 'तीव्र', 'जास्त'],
  },
  low: {
    en: ['mild', 'slight', 'little', 'small', 'minor', 'somewhat'],
    hi: ['हल्का', 'थोड़ा', 'कम', 'मामूली'],
    ta: ['லேசான', 'சிறிய'],
    te: ['తేలికగా', 'కొంచెం'],
    bn: ['সামান্য', 'হালকা'],
    mr: ['थोडा', 'हलका'],
  },
};

// =================== NLP ENGINE ===================

function normalizeText(text) {
  return text.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectLanguage(text) {
  // Simple script detection
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi/Marathi)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
  return 'en';
}

function matchKeywords(text, keywordMap, detectedLang) {
  const normalized = normalizeText(text);
  // Search in detected language first, then fallback to all languages
  const langsToSearch = [detectedLang, 'en', ...Object.keys(keywordMap)].filter((v, i, a) => a.indexOf(v) === i);
  
  for (const lang of langsToSearch) {
    const keywords = keywordMap[lang];
    if (!keywords) continue;
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

function findMatchingKeyword(text, keywordMap, detectedLang) {
  const normalized = normalizeText(text);
  const langsToSearch = [detectedLang, 'en', ...Object.keys(keywordMap)].filter((v, i, a) => a.indexOf(v) === i);
  
  for (const lang of langsToSearch) {
    const keywords = keywordMap[lang];
    if (!keywords) continue;
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
  }
  return null;
}

/**
 * Main NLP function: Extract symptoms, severity, and duration from spoken text
 * @param {string} text - The transcribed speech text
 * @param {string} langHint - Optional language hint from speech recognition
 * @returns {Object} Analysis result with symptoms, score, severity, etc.
 */
export function analyzeSymptoms(text, langHint = null) {
  if (!text || text.trim().length === 0) {
    return { symptoms: [], score: 0, severity: 'ROUTINE', duration: null, painLevel: 0, hasCritical: false, rawText: text };
  }

  const detectedLang = langHint || detectLanguage(text);
  const normalized = normalizeText(text);
  
  // 1. Extract matching symptoms
  const matchedSymptoms = [];
  for (const symptom of SYMPTOM_DB) {
    if (matchKeywords(normalized, symptom.keywords, detectedLang)) {
      const matchedKw = findMatchingKeyword(normalized, symptom.keywords, detectedLang);
      matchedSymptoms.push({
        id: symptom.id,
        category: symptom.category,
        weight: symptom.weight,
        critical: symptom.critical || false,
        matchedKeyword: matchedKw,
        label: symptom.keywords.en[0], // English label for display
      });
    }
  }

  // 2. Detect severity modifiers
  let severityMultiplier = 1.0;
  if (matchKeywords(normalized, SEVERITY_MODIFIERS.high, detectedLang)) {
    severityMultiplier = 1.4;
  } else if (matchKeywords(normalized, SEVERITY_MODIFIERS.low, detectedLang)) {
    severityMultiplier = 0.7;
  }

  // 3. Detect duration
  let duration = null;
  for (const [durKey, durKeywords] of Object.entries(DURATION_KEYWORDS)) {
    if (matchKeywords(normalized, durKeywords, detectedLang)) {
      duration = durKey;
      break;
    }
  }

  // 4. Calculate triage score
  const hasCritical = matchedSymptoms.some(s => s.critical);
  let baseScore = 0;
  
  if (hasCritical) {
    baseScore = 9; // Critical symptoms always get high base
  } else if (matchedSymptoms.length > 0) {
    // Weighted average of matched symptom weights
    const totalWeight = matchedSymptoms.reduce((sum, s) => sum + s.weight, 0);
    baseScore = totalWeight / matchedSymptoms.length;
    // Add bonus for multiple symptoms
    if (matchedSymptoms.length >= 3) baseScore += 1.5;
    else if (matchedSymptoms.length >= 2) baseScore += 0.8;
  }

  // Apply severity modifier
  let score = Math.min(10, baseScore * severityMultiplier);
  
  // Duration bonus
  if (duration === 'week') score = Math.min(10, score + 0.5);
  if (duration === 'month') score = Math.min(10, score + 1.0);
  
  score = Math.round(score * 10) / 10;

  // 5. Determine severity
  let severity;
  if (hasCritical || score >= 8) severity = 'CRITICAL';
  else if (score >= 5) severity = 'URGENT';
  else if (score >= 3) severity = 'MODERATE';
  else severity = 'ROUTINE';

  // 6. Estimate pain level (0-10)
  let painLevel = Math.min(10, Math.round(score));
  if (matchedSymptoms.some(s => s.id === 'severe_pain')) painLevel = Math.max(painLevel, 8);

  return {
    symptoms: matchedSymptoms,
    score,
    severity,
    duration,
    painLevel,
    hasCritical,
    detectedLang,
    rawText: text,
    confidence: matchedSymptoms.length > 0 ? Math.min(0.95, 0.5 + matchedSymptoms.length * 0.15) : 0,
    symptomCount: matchedSymptoms.length,
    categories: [...new Set(matchedSymptoms.map(s => s.category))],
  };
}

/**
 * Convert NLP analysis to triage answers format (compatible with backend)
 */
export function nlpToTriageAnswers(analysis) {
  const answers = {};
  
  // Stage 1: Emergency screening
  answers.q1_1 = analysis.symptoms.some(s => s.id === 'breathing_difficulty' || s.id === 'chest_pain');
  answers.q1_2 = analysis.symptoms.some(s => s.id === 'unconscious');
  answers.q1_3 = analysis.symptoms.some(s => s.id === 'severe_bleeding');
  
  // Stage 2: Severity
  answers.q2_1 = analysis.painLevel;
  
  // Duration mapping
  const durMap = { hours: 'hours', days: '1-2days', week: '3-7days', month: 'over_week' };
  answers.q2_2 = durMap[analysis.duration] || 'hours';
  
  // Symptom progression (assume worsening if severity modifier is high)
  answers.q2_3 = analysis.score >= 7 ? 'rapid' : analysis.score >= 5 ? 'worsening' : analysis.score >= 3 ? 'stable' : 'improving';
  
  // Primary symptom mapping
  const catToSymptom = {
    infection: 'fever', respiratory: 'cough', gastro: 'stomach',
    neurological: 'headache', dermatological: 'skin', pain: 'body_pain',
    general: 'weakness', cardiac: 'other', trauma: 'other',
  };
  const primaryCat = analysis.categories[0] || 'general';
  answers.q2_4 = catToSymptom[primaryCat] || 'other';
  
  // Accompanying symptoms
  const accompanyMap = {
    vomiting: 'nausea', high_fever: 'fever', fever: 'fever',
    weakness: 'dizziness', swelling: 'swelling', breathing_difficulty: 'breathing',
  };
  answers.q2_5 = analysis.symptoms
    .map(s => accompanyMap[s.id])
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  if (answers.q2_5.length === 0) answers.q2_5 = ['none'];
  
  answers.q2_6 = ['none']; // Can't determine from voice alone
  
  // Stage 3
  answers.q3_1 = 'no';
  answers.q3_2 = false;
  answers.q3_3 = false;
  answers.q3_4 = analysis.hasCritical ? 'emergency' : 'new';
  answers.q3_5 = 'adult'; // Default
  
  return answers;
}

export default { analyzeSymptoms, nlpToTriageAnswers };
