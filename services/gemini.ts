
// Importando o cliente GoogleGenAI conforme as diretrizes
import { GoogleGenAI } from "@google/genai";

/**
 * Serviços de IA - Utilizando o SDK oficial do Google Gemini
 * Transcrição via multimodalidade (Gemini 3 Flash)
 * Interpretação via raciocínio profundo (Gemini 3 Pro)
 */

// Inicialização utilizando a variável de ambiente process.env.API_KEY de forma segura
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcreve o áudio utilizando o modelo multimodal Gemini 3 Flash.
 * O Gemini processa o áudio diretamente, eliminando a necessidade de serviços externos como Whisper.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  try {
    // Usando gemini-3-flash-preview para tarefas de transcrição e texto básicas
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType
            }
          },
          { text: "Por favor, transcreva o relato de sonho contido no áudio acima. Retorne apenas o texto transcrito em português brasileiro." }
        ]
      }]
    });

    if (!response.text) {
      throw new Error("Não foi possível extrair a transcrição do áudio.");
    }

    return response.text.trim();
  } catch (error) {
    console.error("Erro técnico na transcrição Gemini:", error);
    throw new Error("Falha na conexão com os céus. Verifique sua rede e tente novamente.");
  }
};

/**
 * Interpreta o sonho utilizando a persona de José do Egito via Gemini 3 Pro.
 */
export const interpretDream = async (name: string, gender: string, dreamText: string) => {
  const systemInstruction = `Você é José do Egito, mestre dos sonhos. 
Saude o usuário pelo nome: "${name}". 
Use "Prezado" para masculino e "Prezada" para feminino baseado no gênero: "${gender}". 
Sua linguagem é sábia e profunda. Dê uma interpretação profética e direta. 
Não cite nomes de psicólogos ou termos técnicos acadêmicos. 
Destaque em negrito apenas as revelações cruciais.`;

  try {
    // Usando gemini-3-pro-preview para tarefas complexas de raciocínio, criatividade e interpretação
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Interprete este sonho: "${dreamText}"`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95
      }
    });

    if (!response.text) {
      throw new Error("Os oráculos não retornaram uma resposta válida.");
    }

    return response.text;
  } catch (error) {
    console.error("Erro técnico na interpretação Gemini:", error);
    throw new Error("Os oráculos estão silenciosos no momento. Tente novamente em instantes.");
  }
};
