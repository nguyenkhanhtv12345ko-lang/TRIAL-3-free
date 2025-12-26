
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Transaction, FinancialStats } from "../types";

export class GeminiService {
  private chatSession: Chat | null = null;

  private getAI() {
    const apiKey = process?.env?.API_KEY || "";
    return new GoogleGenAI({ apiKey });
  }

  private readonly addTransactionTool: FunctionDeclaration = {
    name: 'add_transaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Ghi lại một khoản thu hoặc chi của người dùng.',
      properties: {
        content: { type: Type.STRING, description: 'Nội dung (ví dụ: Ăn trưa, Nhận lương)' },
        amount: { type: Type.NUMBER, description: 'Số tiền thực tế' },
        transaction_type: { type: Type.STRING, description: 'Loại: "Thu" hoặc "Chi"' },
        source: { type: Type.STRING, description: 'Nguồn: "Tiền mặt" hoặc "Tài khoản"' },
        date: { type: Type.STRING, description: 'Ngày (YYYY-MM-DD)' }
      },
      required: ['content', 'amount', 'transaction_type'],
    },
  };

  initChat(transactions: Transaction[], stats: FinancialStats) {
    try {
      const ai = this.getAI();
      const context = `Bạn là FinAssist - Chuyên gia quản lý tài chính cá nhân.
      Dữ liệu hiện tại: Tổng tài sản ${stats.total.toLocaleString()}đ.
      Nhiệm vụ:
      1. Ghi chép thu chi qua hàm add_transaction khi người dùng cung cấp thông tin.
      2. Tư vấn tiết kiệm dựa trên hạn mức ngày: ${stats.cumulativeSaving.toLocaleString()}đ.
      3. Phản hồi ngắn gọn, thân thiện, dùng emoji.`;

      this.chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: context,
          tools: [{ functionDeclarations: [this.addTransactionTool] }],
          temperature: 0.7,
        },
      });
    } catch (e) {
      console.error("Khởi tạo AI thất bại:", e);
      this.chatSession = null;
    }
  }

  // Phương thức xóa session để thoát treo
  resetSession() {
    this.chatSession = null;
  }

  async *askAIStream(query: string) {
    if (!this.chatSession) {
      throw new Error("AI chưa sẵn sàng");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message: query });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.candidates?.[0]?.content?.parts) {
          for (const part of c.candidates[0].content.parts) {
            if (part.functionCall) {
              yield { type: 'function_call', call: part.functionCall };
            }
          }
        }
        const text = c.text;
        if (text) yield { type: 'text', text };
      }
    } catch (e) {
      console.error("AI Stream Error:", e);
      this.chatSession = null; // Tự động reset khi lỗi
      throw e;
    }
  }

  async sendFunctionResponse(callId: string, name: string, response: any) {
    if (!this.chatSession) return;
    try {
      await this.chatSession.sendMessage({
        message: JSON.stringify({
          functionResponses: [{ id: callId, name: name, response: response }]
        })
      });
    } catch (e) {
      console.error("Function Response Error:", e);
      this.chatSession = null;
    }
  }

  async speakText(text: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) await this.playAudio(base64);
    } catch (e) {}
  }

  private async playAudio(base64: string) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
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
