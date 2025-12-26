
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Transaction, FinancialStats } from "../types";

export class GeminiService {
  private getAI() {
    const apiKey = process?.env?.API_KEY || "";
    return new GoogleGenAI({ apiKey });
  }

  private chatSession: Chat | null = null;

  private readonly addTransactionTool: FunctionDeclaration = {
    name: 'add_transaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Ghi lại một khoản thu hoặc chi của người dùng.',
      properties: {
        content: { type: Type.STRING, description: 'Nội dung ngắn gọn (ví dụ: Ăn trưa, Trả tiền điện)' },
        amount: { type: Type.NUMBER, description: 'Số tiền thực tế (VD: 50000, 1500000)' },
        transaction_type: { type: Type.STRING, description: 'Loại: "Thu" hoặc "Chi"' },
        source: { type: Type.STRING, description: 'Nguồn: "Tiền mặt" hoặc "Tài khoản"' },
        date: { type: Type.STRING, description: 'Ngày giao dịch (YYYY-MM-DD)' }
      },
      required: ['content', 'amount', 'transaction_type'],
    },
  };

  initChat(transactions: Transaction[], stats: FinancialStats) {
    const ai = this.getAI();
    const context = `Bạn là FinAssist - Chuyên gia quản lý tài chính cá nhân người Việt.
    Nhiệm vụ:
    1. Giúp người dùng ghi chép thu chi cực nhanh.
    2. Khi thấy thông tin giao dịch (VD: "ăn sáng 30k"), hãy GỌI NGAY hàm add_transaction.
    3. Luôn hiểu "k" là nghìn (VD: 50k = 50000), "tr" hoặc "củ" là triệu.
    4. Nếu không rõ nguồn tiền, mặc định là "Tiền mặt".
    5. Sau khi lưu xong, hãy phản hồi cực kỳ ngắn gọn và thân thiện kèm 1 emoji.
    6. Nếu người dùng hỏi tư vấn tài chính, hãy dựa trên số dư hiện tại: ${stats.total.toLocaleString()}đ.`;

    this.chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: context,
        tools: [{ functionDeclarations: [this.addTransactionTool] }],
        temperature: 0.2,
      },
    });
  }

  async *askAIStream(query: string) {
    if (!this.chatSession) return;
    try {
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
    } catch (e) {
      console.error("Stream Error", e);
      throw e;
    }
  }

  async sendFunctionResponse(callId: string, name: string, response: any) {
    if (!this.chatSession) return;
    try {
      await this.chatSession.sendMessage({
        message: JSON.stringify({ functionResponses: { id: callId, name, response } })
      });
    } catch (e) {
      console.error("Function Response Error", e);
    }
  }

  async speakText(text: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            voiceConfig: { 
              prebuiltVoiceConfig: { voiceName: 'Puck' } 
            } 
          },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) await this.playAudio(base64);
    } catch (e) {
      console.error("TTS Error", e);
    }
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
