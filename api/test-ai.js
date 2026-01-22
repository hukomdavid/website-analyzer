import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key belum diset di Environment Variables Vercel!" });
  }

  // Inisialisasi tanpa paksaan apiVersion
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    // Gunakan nama model standar
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent("Tes koneksi AI.");
    const response = await result.response;
    
    return res.status(200).json({ 
      status: "Sukses", 
      pesan: "Koneksi Berhasil!",
      output: response.text()
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "Gagal", 
      error_detail: error.message,
      saran: "Jika masih 404, coba cek apakah API Key Anda aktif di Google AI Studio."
    });
  }
}
