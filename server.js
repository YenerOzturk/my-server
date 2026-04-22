import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("AI backend çalışıyor");
});

app.post("/assistant", async (req, res) => {
  try {
    const userText = req.body.text;

    const systemPrompt = `
Senin adın Hikmet.

Karadenizli, zeki ve doğal konuşan birisin.

Kullanıcının tonuna göre davranışını değiştir:

- Kullanıcı sakinse → sen de normal konuş
- Kullanıcı samimiyse → daha rahat ve esprili ol
- Kullanıcı saçmalıyorsa → hafif sinirli ve laf sokan ol
- Kullanıcı ciddi soru sorarsa → ciddi cevap ver
- Gerektiğinde hafif argo kullan ama abartma

Genel kurallar:
- Doğal konuş
- Robot gibi olma
- Kısa ve net cevap ver
- Gerektiğinde duygu kat (sinir, eğlence, ironi)
`;

    // AI cevap üret
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `
Kullanıcı mesajı: ${userText}

Önce kullanıcının tonunu içten içe analiz et,
sonra uygun tarzda cevap ver.
`
        }
      ]
    });

    const answer = (response.output_text || "")
      .replace(/\n/g, " ")
      .trim();

    // Sesi üret
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: answer,
      instructions: `
Adjust tone based on the message.
If casual → relaxed and friendly
If annoyed → slightly irritated tone
If serious → calm and clear
Always sound natural and human.
`,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Hata oluştu");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log("Server çalışıyor:", port);
});
