
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Transaction, FinancialStats } from "../types";

export class GeminiService {
  private getAI() {
    // Luôn kiểm tra API KEY để tránh lỗi undefined
    const apiKey = process?.env?.API_KEY || "";
    return new GoogleGenAI({ apiKey });
  }

  private chatSession: Chat | null = null;

  private readonly addTransactionTool: FunctionDeclaration = {
    name: 'add_transaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Ghi lại một khoản thu hoặc chi.',
      properties: {
        content: { type: Type.STRING, description: 'Nội dung (ví dụ: Ăn phở, Lương tháng 5)' },
        amount: { type: Type.NUMBER, description: 'Số tiền VND' },
        transaction_type: { type: Type.STRING, description: 'Thu hoặc Chi' },
        source: { type: Type.STRING, description: 'Tiền mặt hoặc Tài khoản' },
        date: { type: Type.STRING, description: 'YYYY-MM-DD' }
      },
      required: ['content', 'amount', 'transaction_type'],
    },
  };

  initChat(transactions: Transaction[], stats: FinancialStats) {
    const ai = this.getAI();
    const context = `Bạn là FinAssist. Hãy giúp người dùng ghi lại thu chi cực nhanh.
    Sau mỗi khi người dùng cung cấp thông tin giao dịch, hãy gọi hàm add_transaction ngay lập tức.
    Khi hoàn thành, hãy trả lời cực ngắn gọn để người dùng biết bạn đã thực hiện xong.`;

    this.chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: context,
        tools: [{ functionDeclarations: [this.addTransactionTool] }],
        temperature: 0.3,
      },
    });
  }

  async *askAIStream(query: string) {
    if (!this.chatSession) return;
    const result = await this.chatSession.sendMessageStream({ message: query });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.candidates?.[0]?.content?.parts) {
        for (const part of c.candidates[0].content.parts) {
          if (part.functionCall) yield { type: 'function_call', call: part.functionCall };
        }
      }
      if (c.text) yield { type: 'text', text: c.text };
    }
  }

  async sendFunctionResponse(callId: string, name: string, response: any) {
    if (!this.chatSession) return;
    await this.chatSession.sendMessage({
      message: JSON.stringify({ functionResponses: { id: callId, name, response } })
    });
  }

  async speakText(text: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Đọc: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) await this.playAudio(base64);
    } catch (e) {}
  }

  private async playAudio(base64: string) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }
}
export const geminiService = new GeminiService();
