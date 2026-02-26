import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIInsight(data: {
  tasks: any[];
  habits: any[];
  mood: any[];
  finance: any[];
  userName: string;
}) {
  try {
    const prompt = `
      Você é um mentor de bem-estar pessoal e produtividade para o aplicativo "+Cura".
      Analise os seguintes dados do usuário "${data.userName}" e forneça um insight curto, motivador e prático (máximo 3 frases).
      
      Dados Atuais:
      - Tarefas Pendentes: ${data.tasks.filter(t => !t.completed).length}
      - Tarefas Concluídas: ${data.tasks.filter(t => t.completed).length}
      - Hábitos Ativos: ${data.habits.length}
      - Último Humor: ${data.mood[0]?.mood || 'Não registrado'}
      - Saldo Financeiro: R$ ${data.finance.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toFixed(2)}
      
      Instruções:
      1. Seja empático e profissional.
      2. Se houver muitas tarefas pendentes, sugira priorização.
      3. Se o humor estiver baixo, sugira um hábito de autocuidado.
      4. Se as finanças estiverem negativas, dê uma dica de economia.
      5. Use Markdown para formatação leve.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error getting AI insight:", error);
    return "Continue focado em sua jornada de autocuidado. Cada pequeno passo conta para sua evolução pessoal.";
  }
}
