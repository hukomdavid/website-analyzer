import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Header Keamanan & CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  
  // Memanggil API Key dari Environment Variable Vercel
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Perubahan di sini: Menggunakan model tanpa prefix versi yang membingungkan
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Lakukan audit mendalam untuk website: ${url}. 
    Berikan skor (0-100) dan analisis tajam untuk kategori berikut:
    1. UI/UX (Hierarki visual & aksesibilitas)
    2. SEO (Metadata & On-page)
    3. GEO (AI-readiness, kepadatan fakta, citability)
    4. Security (Analisis protokol & risiko header)
    5. Technology Lookup (Tebak tech stack yang digunakan)

    Respon WAJIB dalam format JSON murni tanpa markdown:
    {
      "url": "${url}",
      "overallScore": 85,
      "techStack": ["React", "Tailwind"],
      "categories": {
        "uiux": { "score": 80, "summary": "", "issues": [], "recommendations": [] },
        "seo": { "score": 75, "summary": "", "issues": [], "recommendations": [] },
        "geo": { "score": 70, "summary": "", "issues": [], "recommendations": [] },
        "security": { "score": 90, "summary": "", "issues": [], "recommendations": [] }
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Pembersihan jika AI memberikan format markdown ```json
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: "AI Analysis Failed", 
      details: error.message 
    });
  }
}
