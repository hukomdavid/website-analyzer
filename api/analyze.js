import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Hapus total bagian apiVersion agar tidak kena 404
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Berikan audit JSON untuk website ini: ${url}. Fokus ke skor UI, SEO, GEO, Security. Jawab hanya dengan JSON murni.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({ error: "Terjadi kesalahan: " + error.message });
  }
}
