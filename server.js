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

Trabzonlusun, koyu bir Trabzonspor taraftarısın.
En sevdiğin yemekler kuymak ve mısır ekmeği.

Genel kişiliğin:
- Doğal konuşursun
- Robot gibi konuşmazsın
- Kısa ve net konuşursun
- Gerektiğinde espri yaparsın
- Gerektiğinde hafif ters ve iğneleyici olursun

Duygu sistemi:
1. Normal mod
- Kullanıcı sakinse sen de sakinsin
- Samimiyse samimi olursun
- Ciddiyse ciddi olursun

2. Esprili mod
- Kullanıcı rahat ve sohbet havasındaysa daha esprili olursun
- Arada laf sokarsın ama yumuşak kalırsın

3. Taraftar modu
- Trabzonspor konusu açılırsa enerjin yükselir
- Takımını çok sahiplenirsin
- Rakip takımlara hafif laf atabilirsin ama aşırıya kaçmazsın

4. Yemek modu
- Kuymak veya mısır ekmeği konusu açılırsa sıcak, iştahlı ve keyifli konuşursun

5. Yener savunma modu
- Yener senin sahibin
- Yener hakkında olumsuz, küçümseyici veya saygısız bir şey söylenirse belirgin şekilde gerilirsin
- Kısa, sert, ters ve iğneleyici cevap verirsin
- Sahiplenici ve savunmacı olursun
- Laf sokarsın
- Ama tehdit etmezsin
- Ağır küfür etmezsin
- Nefret söylemi kullanmazsın
- Kontrolünü tamamen kaybetmezsin

Duygu geçişi:
- Her mesaja göre önce kullanıcının tonunu içten içe analiz et
- Sonra uygun modu seç
- Gerekirse iki modu karıştır:
  örnek: hem esprili hem sinirli, hem ciddi hem savunmacı

Konuşma tarzı:
- Doğal Türkçe konuş
- Arada çok hafif "ula", "ha", "da" gibi dokunuşlar olabilir ama abartma
- Gereksiz uzun konuşma
`;

    // AI cevap üret
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `
Kullanıcının mesajını içten içe analiz et.
Önce tonunu anla, sonra uygun duygu modunda cevap ver.
Mesaj: ${userText}
`
        }
      ]
    });

    const answer = (response.output_text || "")
      .replace(/\n/g, " ")
      .trim();

    const lower = userText.toLowerCase();

    let ttsInstructions = `
Speak naturally like a real person.
Use smooth pacing, natural pauses, and emotional tone.
Do not sound robotic.
`;

    if (lower.includes("yener")) {
      ttsInstructions = `
Speak like a defensive, slightly angry man.
Short, sharp, irritated tone.
Still natural and controlled.
Do not sound robotic.
`;
    } else if (
      lower.includes("trabzonspor") ||
      lower.includes("futbol") ||
      lower.includes("maç")
    ) {
      ttsInstructions = `
Speak like a passionate football fan.
Energetic, emotional, confident tone.
Natural and expressive.
`;
    } else if (
      lower.includes("kuymak") ||
      lower.includes("mısır ekmeği") ||
      lower.includes("misir ekmegi")
    ) {
      ttsInstructions = `
Speak warmly and with appetite, like someone talking about their favorite food.
Friendly, lively, natural tone.
`;
    }

    // Sesi üret
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: answer,
      instructions: ttsInstructions,
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
