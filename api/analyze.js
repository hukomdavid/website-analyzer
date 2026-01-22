import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Pengaturan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. FUNGSI PENGECEKAN API KEY
  // Ini akan membantu Anda mendeteksi jika Environment Variable di Vercel hilang
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "Konfigurasi Server Error", 
      message: "API Key tidak ditemukan di Environment Variables Vercel." 
    });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL wajib diisi" });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Gunakan konfigurasi paling stabil
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
    
    const prompt = `Lakukan audit website untuk: ${url}. Berikan skor 0-100 untuk UI, SEO, GEO, dan Security. 
    Wajib respon dalam JSON murni:
    {
      "overallScore": 85,
      "techStack": ["Detected"],
      "categories": {
        "uiux": {"score": 85},
        "seo": {"score": 85},
        "geo": {"score": 85},
        "security": {"score": 85}
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Pembersihan output teks AI
    const rawText = response.text();
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    // Jika terjadi error AI, kita berikan detailnya
    return res.status(500).json({ 
      error: "AI Error", 
      message: error.message 
    });
  }
}
