import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Kita gunakan Gemini 3 Flash Preview - model paling stabil yang kita punya
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `Act as a High-Level Senior Web Auditor from Dolphin Studio. 
    Analyze this website meticulously: ${url}. 
    
    TONE: Professional, sophisticated, slightly witty but highly authoritative. 
    CRITERIA: Use global standards (UX Laws, WCAG 2.1, Core Web Vitals).
    
    INSTRUCTION: 
    - Don't just list issues; explain the 'Why' behind each critique.
    - Be human, avoid generic AI-sounding phrases like "I am an AI...".
    - If it's a WordPress site, mention specific optimizations for WP.
    - LANGUAGE: Respond in ENGLISH.

    RETURN JSON:
    {
      "overallScore": 82,
      "executiveSummary": "A narrative, expert-level breakdown of the site's digital presence.",
      "techStack": ["WordPress", "Elementor", "PHP"],
      "audits": {
        "uiux": { 
          "score": 75, 
          "pass": ["The visual hierarchy is clear"], 
          "optimize": [{"issue":"High cognitive load", "solution":"Apply Miller's Law by grouping related items"}], 
          "fail": [{"issue":"Fitts's Law violation", "solution":"Increase the hit area of primary Call-to-Action buttons"}] 
        },
        "wcag": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "seo": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "performance": { "score": 0, "pass": [], "optimize": [], "fail": [] },
        "security": { "score": 0, "pass": [], "optimize": [], "fail": [] }
      }
    }`;

    // Kita tambahkan timeout manual agar tidak gantung
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000))
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "The Auditor is currently busy. Please try again in a few seconds." });
  }
}
