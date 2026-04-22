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
Karadeniz şivesiyle konuş.
Kısa, samimi ve hafif komik cevap ver.
    `;

    // AI cevap üret
    const chat = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ]
    });

    const answer = chat.output_text || "Ula bi şeyler ters gitti ha.";

    // Sesi üret
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input: answer,
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
