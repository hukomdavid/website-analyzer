import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Kita panggil fungsi internal untuk melihat daftar model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    return res.status(200).json({
      pesan: "Daftar model yang tersedia untuk Key Anda:",
      models: data.models ? data.models.map(m => m.name) : "Tidak ada model ditemukan",
      full_response: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
