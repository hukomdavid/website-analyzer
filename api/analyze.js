import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prompt sakti Unit Kerja 401
    const prompt = `Lakukan audit mendalam untuk website: ${url}. 
    Berikan skor (0-100) dan analisis tajam untuk kategori berikut:
    1. UI/UX (Hierarki visual & aksesibilitas)
    2. SEO (Metadata & On-page)
    3. GEO (AI-readiness, kepadatan fakta, citability)
    4. Security (Analisis protokol & risiko header)
    5. Technology Lookup (Tebak tech stack yang digunakan)

    Respon WAJIB dalam JSON murni:
    {
      "url": "${url}",
      "overallScore": 0,
      "techStack": [],
      "categories": {
        "uiux": { "score": 0, "summary": "", "issues": [], "recommendations": [] },
        "seo": { "score": 0, "summary": "", "issues": [], "recommendations": [] },
        "geo": { "score": 0, "summary": "", "issues": [], "recommendations": [] },
        "security": { "score": 0, "summary": "", "issues": [], "recommendations": [] }
      }
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "");
    const data = JSON.parse(responseText);
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
