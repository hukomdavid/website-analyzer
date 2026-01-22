import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Katakan 'Koneksi Berhasil'");
    const response = await result.response;
    
    return res.status(200).json({ 
      status: "Sukses", 
      pesan: response.text() 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "Gagal", 
      error: error.message 
    });
  }
}
