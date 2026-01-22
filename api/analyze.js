import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  
  // Pastikan ini mengambil dari Environment Variable Vercel
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Kita gunakan gemini-pro atau gemini-1.5-flash-latest
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analisa website ini: ${url}. Berikan skor 0-100 untuk UI, SEO, GEO, dan Security. 
    Respon dalam format JSON murni:
    {
      "overallScore": 80,
      "techStack": ["N/A"],
      "categories": {
        "uiux": {"score": 80},
        "seo": {"score": 80},
        "geo": {"score": 80},
        "security": {"score": 80}
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Kirim hasil akhir
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    // Detail error agar kita tahu rusaknya di mana
    return res.status(500).json({ error: error.message });
  }
}
