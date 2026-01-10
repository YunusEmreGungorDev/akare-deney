require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const multer = require("multer");

const app = express();
const upload = multer(); // Bellek üzerinden dosya transferi için

app.use(cors());
app.use(express.json());

// GÜVENLİ GÖRSEL YÜKLEME (Artık API Key tarayıcıda görünmeyecek)
app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("image", req.file.buffer.toString("base64"));

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    res.json({ success: true, url: response.data.data.url });
  } catch (error) {
    console.error("Görsel yükleme hatası:", error);
    res
      .status(500)
      .json({ success: false, error: "Görsel ImgBB'ye gönderilemedi." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(
    `🚀 Güvenlik Sunucusu http://localhost:${PORT} üzerinde çalışıyor.`
  )
);
