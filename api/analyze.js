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
    // Menggunakan Gemini 3 Flash Preview (Sesuai eksperimen sukses Anda)
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `Bertindaklah sebagai Senior Web Auditor yang sangat kejam, jujur, dan sarkas. 
    Analisa website ini: ${url}. 
    Berikan kritik yang menusuk, jangan basa-basi. Cari jejak CMS WordPress/Shopify/dll.
    
    Respon WAJIB JSON murni (Singkat & Padat):
    {
      "overallScore": 45,
      "summary": "1 kalimat kritik pedas yang merangkum kehancuran web ini.",
      "techStack": ["WordPress", "Detected Tech"],
      "categories": {
        "uiux": {
          "score": 50,
          "analysis": "Kritik WCAG & visual dalam 2 poin singkat dan kasar."
        },
        "seo": {
          "score": 30,
          "analysis": "Sebutkan 2 dosa besar SEO web ini secara to-the-point."
        },
        "geo": {
          "score": 60,
          "analysis": "Komentar pedas soal kecepatan/lokasi server."
        },
        "security": {
          "score": 40,
          "analysis": "Kritik soal SSL/Header keamanan."
        }
      },
      "recommendations": [
        "Saran perbaikan 1 (singkat)",
        "Saran perbaikan 2 (singkat)"
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return res.status(500).json({ error: "AI Error", message: error.message });
  }
}
