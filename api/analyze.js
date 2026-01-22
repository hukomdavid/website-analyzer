import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `Bertindaklah sebagai Senior Auditor dari Dolphin Studio. 
    Analisa website ini secara mendalam: ${url}. 
    Gunakan standar berikut:
    - UI/UX: Berdasarkan UX Laws (Hick's Law, Fitts's Law).
    - Accessibility: Berdasarkan WCAG 2.1 Compliance.
    - SEO: Berdasarkan E-E-A-T & Google Search Essentials.
    - Performance: Berdasarkan Core Web Vitals.
    - Security: Berdasarkan OWASP Top 10.

    Berikan respon JSON murni dengan detail teknis:
    {
      "overallScore": 0,
      "executiveSummary": "Narasi expert yang mendalam.",
      "techStack": [],
      "audits": {
        "uiux": {
          "score": 0,
          "pass": ["poin yang sudah bagus"],
          "optimize": [{"issue": "masalah", "solution": "cara optimasi"}],
          "fail": [{"issue": "kesalahan fatal", "solution": "cara perbaikan"}]
        },
        "wcag": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "seo": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "performance": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "security": { "score": 0, "pass": [], "optimize": [], "fail": [] }
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return res.status(500).json({ error: "Audit Failed", message: error.message });
  }
}
