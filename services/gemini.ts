// services/gemini.ts - Versão corrigida para exportação compatível

/**
 * Transcreve o áudio utilizando Whisper via Groq
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) throw new Error("Chave VITE_GROQ_API_KEY não configurada na Vercel.");

  // Conversão de Base64 para Blob
  const byteCharacters = atob(base64Audio);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const audioBlob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "pt");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Falha na transcrição.");
  }

  const data = await response.json();
  return data.text;
};

/**
 * Interpreta o sonho utilizando Llama 3 via Groq
 */
export const interpretDream = async (name: string, gender: string, dreamText: string) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("Chave VITE_GROQ_API_KEY não configurada.");

  const systemInstruction = `Você é José do Egito. Saude ${name} como ${gender === 'masculino' ? 'Prezado' : 'Prezada'}. Dê uma interpretação profética e profunda. Use negrito para pontos cruciais.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Interprete este sonho: "${dreamText}"` }
      ],
      model: "llama3-8b-8192", // Modelo estável para o plano free
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Falha na interpretação.");
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
