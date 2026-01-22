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
    
    const prompt = `Act as a Senior Digital Auditor from Dolphin Studio. 
    Critically analyze: ${url}. 
    Use English for all responses. 
    Frameworks: UX Laws (Jakob's, Fitts's, Miller's), WCAG 2.1, Core Web Vitals, and OWASP.

    Return pure JSON:
    {
      "overallScore": 0,
      "executiveSummary": "A concise, expert-level analysis.",
      "techStack": [],
      "audits": {
        "uiux": { "score": 0, "pass": [], "optimize": [{"issue":"", "solution":""}], "fail": [{"issue":"", "solution":""}] },
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
