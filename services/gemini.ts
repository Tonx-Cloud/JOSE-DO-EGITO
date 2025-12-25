export const interpretDream = async (name: string, gender: string, dreamText: string) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("API Key não encontrada.");

  const systemInstruction = `Você é José do Egito, mestre dos sonhos. 
Saude o usuário pelo nome: "${name}". 
Use "Prezado" para masculino e "Prezada" para feminino: "${gender}". 
Sua linguagem é sábia. Dê uma interpretação profética e direta. 
Não use termos técnicos. Destaque o principal em negrito.`;

  try {
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
        // Mudança para o modelo 8B (Mais rápido e com limites maiores no plano grátis)
        model: "llama3-8b-8192", 
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro detalhado da Groq:", errorData); // Isso aparecerá no F12
      throw new Error(errorData.error?.message || "Falha na interpretação");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro na chamada de interpretação:", error);
    throw error;
  }
};
