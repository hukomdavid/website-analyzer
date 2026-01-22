import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  // Inisialisasi tanpa menyebutkan apiVersion agar otomatis pakai yang stabil
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // KUNCINYA: Cukup masukkan nama model saja
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
    
    const prompt = `Lakukan audit cepat untuk website: ${url}. Berikan skor 0-100 untuk UI, SEO, GEO, dan Security. 
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
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    // Menampilkan pesan error yang lebih bersih
    return res.status(500).json({ error: "AI Error: " + error.message });
  }
}
