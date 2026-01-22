import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Pengaturan CORS agar bisa diakses dari mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key belum diset di Environment Variables Vercel!" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    // Memaksa penggunaan API v1 dan model Flash terbaru (Gratis)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest" 
    }, { apiVersion: 'v1' });

    const result = await model.generateContent("Halo, apakah kamu sudah online?");
    const response = await result.response;
    
    return res.status(200).json({ 
      status: "Sukses", 
      pesan: "Koneksi ke Google AI Berhasil!",
      jawabanAI: response.text() 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "Gagal", 
      error_detail: error.message,
      catatan: "Jika error 404, pastikan library @google/generative-ai di package.json sudah versi 0.21.0"
    });
  }
}
