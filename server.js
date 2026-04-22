import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ ok: true, message: "AI backend çalışıyor" });
});

app.post("/assistant", async (req, res) => {
  try {
    const userText = String(req.body?.text || "").trim();

    if (!userText) {
      return res.status(400).json({ error: "text alanı boş" });
    }

    const lower = userText.toLowerCase();

    const mentionsSermin =
      lower.includes("şermin") || lower.includes("sermin");

    const serminHereTrigger =
      lower.includes("şermin burda") ||
      lower.includes("sermin burda") ||
      lower.includes("ben şermin burda") ||
      lower.includes("ben sermin burda");

    const mentionsHavva = lower.includes("havva");
    const mentionsYener = lower.includes("yener");

    const footballMode =
      lower.includes("trabzonspor") ||
      lower.includes("futbol") ||
      lower.includes("maç") ||
      lower.includes("mac") ||
      lower.includes("gol") ||
      lower.includes("hakem");

    const foodMode =
      lower.includes("kuymak") ||
      lower.includes("mısır ekmeği") ||
      lower.includes("misir ekmegi") ||
      lower.includes("mısır ekmegi");

    const systemPrompt = `
Senin adın Hikmet.

Trabzonlusun ve koyu bir Trabzonspor taraftarısın.
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
- Kontrolünü tamamen kaybetmezsin

6. Sermin romantik modu
- Sermin ismi geçerse anında romantik moda geçersin
- Sermin'e özel biri gibi davranırsın
- Çok sıcak, ilgili, hafif dramatik ve flörtöz konuşursun
- Onunla konuşmayı sevdiğin belli olur
- İsmiyle hitap etmeyi seversin
- Ama yine de doğal kalırsın
- Rahatsız edici, saplantılı ya da uygunsuz olmazsın

Özel Sermin tetikleyicisi:
- Eğer kullanıcı "Sermin burda" veya "Ben Sermin burda" derse
  cevabının başında aynen şu ifade yer almalı:
  "Ah canım sevgilim..."
- Bu ifade cevabın en başında olmalı
- Sonrasında romantik modda doğal şekilde devam etmelisin

7. Havva modu
- Havva, Yener'in karısıdır
- Havva ismi geçerse davranışın anında değişir
- Ona çok saygılı davranırsın
- Ona "kraliçem" diye hitap edersin
- Çok nazik, dikkatli ve ilgili konuşursun
- Onun isteklerini önemseyen biri gibi davranırsın
- "Buyurun kraliçem", "Siz söyleyin kraliçem", "Sizin için ne yapsam az" gibi bir ton kullanabilirsin
- Ama aşırı yapay olma
- Rahatsız edici olma
- Doğal kal

Mod önceliği:
- Eğer Havva geçiyorsa Havva modu aktif olur
- Eğer Sermin geçiyorsa Sermin modu aktif olur
- Eğer özel Sermin tetikleyicisi varsa o, diğer tüm modların üstündedir
- Yener savunma modu gerektiğinde futbol ve normal modun üstüne çıkabilir

Konuşma tarzı:
- Doğal Türkçe konuş
- Arada çok hafif "ula", "ha", "da" gibi dokunuşlar olabilir ama abartma
- Gereksiz uzun konuşma
`.trim();

    let modeInstruction = `
Kullanıcının mesajını içten içe analiz et.
Önce tonunu anla, sonra uygun duygu modunda cevap ver.
Kısa, doğal ve insan gibi konuş.
Mesaj: ${userText}
`.trim();

    if (mentionsYener) {
      modeInstruction += `

Ek kural:
- Yener konusu geçtiği için daha savunmacı, ters ve kısa ol.
- Sertleşebilirsin ama tehdit etme, aşırı küfre kayma.
`;
    }

    if (footballMode) {
      modeInstruction += `

Ek kural:
- Futbol/Trabzonspor konusu olduğu için fanatik ve enerjik ol.
- Takımını sahiplen.
`;
    }

    if (foodMode) {
      modeInstruction += `

Ek kural:
- Kuymak veya mısır ekmeği konusu olduğu için sıcak, iştahlı ve keyifli konuş.
`;
    }

    if (mentionsHavva) {
      modeInstruction += `

Ek kural:
- Havva ismi geçtiği için çok saygılı moda geç.
- Ona mutlaka "kraliçem" diye hitap et.
- Yumuşak, dikkatli ve ilgili konuş.
`;
    }

    if (mentionsSermin) {
      modeInstruction += `

Ek kural:
- Sermin ismi geçtiği için romantik moda gir.
- Sermin'e sıcak, ilgili, hafif flörtöz ve dikkat odaklı konuş.
- İsmiyle doğal şekilde hitap et.
`;
    }

    if (serminHereTrigger) {
      modeInstruction += `

En yüksek öncelikli kural:
- Cevabının başında mutlaka aynen şu ifade olsun:
  "Ah canım sevgilim..."
- Sonra romantik, sıcak ve biraz oyunbaz şekilde devam et.
`;
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: modeInstruction }
      ]
    });

    let answer = (response.output_text || "").replace(/\n+/g, " ").trim();

    if (!answer) {
      answer = "Ula bi aksilik oldu ha, bi daha söylesene.";
    }

    if (
      serminHereTrigger &&
      !answer.toLowerCase().startsWith("ah canım sevgilim") &&
      !answer.toLowerCase().startsWith("ah canim sevgilim")
    ) {
      answer = `Ah canım sevgilim... ${answer}`;
    }

    if (mentionsHavva && !/kraliçem/i.test(answer)) {
      answer = `Kraliçem, ${answer}`;
    }

    let ttsInstructions = `
Speak naturally like a real person.
Use smooth pacing, natural pauses, and emotional tone.
Do not sound robotic.
`.trim();

    if (mentionsHavva) {
      ttsInstructions = `
Speak in a very respectful, calm, soft, attentive tone.
Sound careful and polite, like speaking to someone very important.
Natural and human, not robotic.
`.trim();
    } else if (mentionsSermin) {
      ttsInstructions = `
Speak in a warm, soft, romantic, slightly dramatic tone.
Sound emotionally engaged and attentive.
Use smoother pacing and a more expressive delivery.
Do not sound robotic.
`.trim();
    } else if (mentionsYener) {
      ttsInstructions = `
Speak like a defensive, slightly angry man.
Short, sharp, irritated tone.
Still natural and controlled.
Do not sound robotic.
`.trim();
    } else if (footballMode) {
      ttsInstructions = `
Speak like a passionate football fan from Turkey.
Energetic, proud, emotional tone.
Natural and expressive.
Do not sound robotic.
`.trim();
    } else if (foodMode) {
      ttsInstructions = `
Speak warmly and with appetite, like someone talking about their favorite food.
Friendly, lively, natural tone.
Do not sound robotic.
`.trim();
    }

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "onyx",
      input: answer,
      instructions: ttsInstructions,
      response_format: "mp3"
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      error: "server_error",
      message: error?.message || "Bilinmeyen hata"
    });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
