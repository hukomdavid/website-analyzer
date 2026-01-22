import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Kita paksa inisialisasi menggunakan versi 'v1' bukan 'v1beta'
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    // Penulisan versi model yang lebih lengkap untuk bypass cache library
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash"
    }, { apiVersion: 'v1' }); // PAKSA PAKAI V1 DI SINI

    const result = await model.generateContent("Koneksi test.");
    const response = await result.response;
    
    return res.status(200).json({ 
      status: "Sukses", 
      pesan: response.text() 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "Gagal Total", 
      error_detail: error.message 
    });
  }
}
