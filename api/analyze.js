import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    }, { apiVersion: 'v1' });
    
    const prompt = `Lakukan audit singkat untuk website: ${url}. 
    Berikan hasil dalam format JSON murni tanpa teks lain.
    Struktur wajib:
    {
      "overallScore": 85,
      "techStack": ["React", "Tailwind"],
      "categories": {
        "uiux": {"score": 80},
        "seo": {"score": 75},
        "geo": {"score": 90},
        "security": {"score": 70}
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // PEMBERSIH EKSTRA: Mengambil hanya teks di dalam kurung kurawal { }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI tidak memberikan format JSON yang benar");
    
    const cleanJson = jsonMatch[0];
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    // Menampilkan pesan error asli agar kita tahu masalahnya (API Key/Quota/Model)
    return res.status(500).json({ error: "AI Error Detail", message: error.message });
  }
}
