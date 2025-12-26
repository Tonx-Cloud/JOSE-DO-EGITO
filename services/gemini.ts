// services/gemini.ts

interface TranscriptionResponse {
  text: string;
}

interface DreamInterpretationResponse {
  interpretation: string;
}

/**
 * Transcreve áudio usando a API Groq
 * @param base64Audio - Áudio em formato base64
 * @param mimeType - Tipo MIME do áudio (ex: audio/webm, audio/mp3)
 * @returns Texto transcrito
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY não encontrada nas variáveis de ambiente');
    }

    // Converte base64 para Blob
    const byteString = atob(base64Audio.split(',')[1] || base64Audio);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeType });
    
    // Cria FormData para envio
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pt');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro na transcrição: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: TranscriptionResponse = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw error;
  }
}

/**
 * Interpreta sonhos usando a API Groq
 * @param name - Nome da pessoa
 * @param gender - Gênero (masculino/feminino)
 * @param dreamText - Texto do sonho
 * @returns Interpretação do sonho
 */
export async function interpretDream(
  name: string,
  gender: string,
  dreamText: string
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GROQ_API_KEY não encontrada nas variáveis de ambiente');
    }

    const prompt = `Você é José do Egito, o famoso intérprete de sonhos bíblico. 
    
Interprete o seguinte sonho de ${name} (${gender}):

"${dreamText}"

Forneça uma interpretação profunda e significativa, considerando simbolismos bíblicos e psicológicos.
Use uma linguagem respeitosa e inspiradora.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é José do Egito, sábio intérprete de sonhos da Bíblia.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro na interpretação: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Não foi possível interpretar o sonho.';
  } catch (error) {
    console.error('Erro ao interpretar sonho:', error);
    throw error;
  }
}
