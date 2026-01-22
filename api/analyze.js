import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL wajib diisi" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key tidak ditemukan di Vercel Settings." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // PAKSA ke v1 dan gemini-1.5-flash-latest (Gratis)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    }, { apiVersion: 'v1' });
    
    const prompt = `Lakukan audit website untuk: ${url}. Berikan skor 0-100 untuk UI, SEO, GEO, dan Security. 
    Wajib respon dalam JSON murni saja:
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
    const text = response.text();
    
    // Membersihkan teks dari markdown ```json agar bisa di-parse
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    return res.status(500).json({ 
      error: "AI Error", 
      message: error.message 
    });
  }
}
