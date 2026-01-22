import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Pengaturan CORS agar bisa dipanggil dari frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request untuk CORS
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Pastikan hanya menerima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  // Validasi sederhana jika URL kosong
  if (!url) {
    return res.status(400).json({ error: "URL wajib diisi" });
  }
  
  // 2. Inisialisasi Google Generative AI
  // Pastikan GEMINI_API_KEY sudah ada di Environment Variables Vercel
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // 3. Konfigurasi Model
    // Kita hapus apiVersion manual dan gunakan JSON Mode agar output rapi
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    
    const prompt = `Lakukan audit cepat untuk website: ${url}. 
    Berikan analisis singkat dan skor 0-100 untuk UI, SEO, GEO, dan Security. 
    Wajib memberikan respon dalam format JSON seperti ini:
    {
      "overallScore": 85,
      "techStack": ["React", "Tailwind"],
      "categories": {
        "uiux": {"score": 85},
        "seo": {"score": 80},
        "geo": {"score": 75},
        "security": {"score": 90}
      }
    }`;

    // 4. Memanggil API Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Karena kita sudah pakai responseMimeType: "application/json", 
    // AI akan langsung memberikan string JSON yang valid.
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Detail Error:", error);
    
    // Memberikan pesan error yang lebih informatif ke frontend
    return res.status(500).json({ 
      error: "AI Error", 
      message: error.message 
    });
  }
}
