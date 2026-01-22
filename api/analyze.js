import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL wajib diisi" });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Lakukan audit website untuk: ${url}. 
    Berikan respon dalam JSON murni (tanpa teks pembuka/penutup):
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
    
    // Filter untuk mengambil bagian JSON saja jika AI memberikan teks tambahan
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    return res.status(500).json({ 
      error: "AI Error", 
      message: error.message 
    });
  }
}




