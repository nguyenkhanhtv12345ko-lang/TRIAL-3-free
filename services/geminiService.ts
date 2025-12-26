
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Transaction, FinancialStats } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  private chatSession: Chat | null = null;

  // Khai báo công cụ thêm giao dịch cho AI
  private readonly addTransactionTool: FunctionDeclaration = {
    name: 'add_transaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Thêm một giao dịch thu hoặc chi mới vào nhật ký tài chính của người dùng.',
      properties: {
        content: {
          type: Type.STRING,
          description: 'Mô tả ngắn gọn về giao dịch (ví dụ: Ăn trưa, Nhận lương, Mua cafe)',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Số tiền giao dịch (đơn vị VND)',
        },
        transaction_type: {
          type: Type.STRING,
          description: 'Loại giao dịch: "Thu" cho thu nhập, "Chi" cho chi tiêu.',
        },
        source: {
          type: Type.STRING,
          description: 'Nguồn tiền: "Tiền mặt" hoặc "Tài khoản". Nếu người dùng không nói, hãy mặc định là "Tiền mặt".',
        },
        date: {
          type: Type.STRING,
          description: 'Ngày giao dịch định dạng YYYY-MM-DD. Mặc định là ngày hôm nay.',
        }
      },
      required: ['content', 'amount', 'transaction_type'],
    },
  };

  initChat(transactions: Transaction[], stats: FinancialStats) {
    const ai = this.getAI();
    const today = new Date().toISOString().split('T')[0];
    
    const context = `
      Bạn là FinAssist - Trợ lý quản lý dòng tiền thông minh.
      Hôm nay là ngày: ${today}.
      
      Dữ liệu người dùng hiện tại:
      - Tiền mặt: ${stats.currentCash.toLocaleString()} VND
      - Tài khoản: ${stats.currentBank.toLocaleString()} VND
      - Tổng cộng: ${stats.total.toLocaleString()} VND
      
      QUY TẮC QUAN TRỌNG:
      1. Nếu người dùng mô tả một sự việc có tính chất tài chính (ví dụ: "mình vừa ăn phở 50k", "vừa được thưởng 1 triệu"), hãy LUÔN gọi hàm 'add_transaction' để ghi lại.
      2. Sau khi gọi hàm thành công, hãy xác nhận lại với người dùng một cách thân thiện.
      3. Nếu thông tin thiếu (ví dụ: "mình mới tiêu tiền"), hãy hỏi lại số tiền cụ thể.
      4. Phán đoán thông minh: "mất", "trả", "mua", "chi" -> Chi; "nhận", "thưởng", "lương", "đòi nợ được" -> Thu.
    `;

    this.chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: context,
        tools: [{ functionDeclarations: [this.addTransactionTool] }],
        temperature: 0.5,
      },
    });
  }

  async *askAIStream(query: string) {
    if (!this.chatSession) throw new Error("Chat chưa được khởi tạo");
    
    const result = await this.chatSession.sendMessageStream({ message: query });
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      
      // Nếu có lệnh gọi hàm (Tool Call)
      if (c.candidates?.[0]?.content?.parts) {
        for (const part of c.candidates[0].content.parts) {
          if (part.functionCall) {
             // Chúng ta sẽ trả về một object đặc biệt để component xử lý
             yield { type: 'function_call', call: part.functionCall };
          }
        }
      }

      if (c.text) {
        yield { type: 'text', text: c.text };
      }
    }
  }

  async sendFunctionResponse(callId: string, name: string, response: any) {
    if (!this.chatSession) return;
    await this.chatSession.sendMessage({
      message: JSON.stringify({
        functionResponses: {
          id: callId,
          name: name,
          response: response
        }
      })
    });
  }

  async speakText(text: string) {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Đọc nội dung này bằng tiếng Việt: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await this.playAudioFromBase64(base64Audio);
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  }

  private async playAudioFromBase64(base64: string) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const bytes = this.decode(base64);
    const audioBuffer = await this.decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const geminiService = new GeminiService();
