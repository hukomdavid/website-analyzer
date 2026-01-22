import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL wajib diisi" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Konfigurasi Server Error: API Key tidak ditemukan di Vercel." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    
    // Teknik ekstraksi JSON yang lebih kuat
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI tidak memberikan format JSON yang valid");
    }
    
    return res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    // KUNCINYA: Kita kirim detail error aslinya agar tahu kenapa AI-nya mogok
    return res.status(500).json({ 
      error: "AI Error", 
      message: error.message 
    });
  }
}
