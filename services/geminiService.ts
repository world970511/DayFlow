import { GoogleGenAI } from "@google/genai";
import { Task } from '../types';

// Initialize Gemini Client
// IMPORTANT: In a real production app, never expose keys on the client.
// This is for the demo context where process.env.API_KEY is injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDailyReview = async (tasks: Task[], userName: string): Promise<string> => {
  try {
    const completedTasks = tasks.filter(t => t.completed).map(t => `- [완료] ${t.text} (메모: ${t.memo})`).join('\n');
    const incompleteTasks = tasks.filter(t => !t.completed).map(t => `- [미완료] ${t.text}`).join('\n');
    const completionRate = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

    const prompt = `
      당신은 ${userName}님을 위한 친절하고 격려해주는 생산성 비서입니다.
      오늘의 할 일 목록을 분석해주세요:
      
      ${completedTasks}
      ${incompleteTasks}

      달성률: ${completionRate}%

      오늘 하루에 대한 짧고 따뜻하며 건설적인 리뷰를 한국어로 작성해주세요 (최대 3문장).
      사용자가 잘했다면 축하해주고, 놓친 일이 있다면 내일은 할 수 있다고 부드럽게 격려해주세요.
      볼드체나 이탤릭체 같은 마크다운 서식은 사용하지 말고 평문으로 작성해주세요.
      존댓말(해요체)을 사용해주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "오늘도 수고 많으셨어요! 내일도 힘차게 나아가봐요.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "오늘 하루도 기록하느라 수고하셨습니다!";
  }
};

export const generateMorningBriefing = async (tasks: Task[], userName: string): Promise<string> => {
    try {
      const taskList = tasks.map(t => `- ${t.text}`).join('\n');
      
      const prompt = `
        당신은 ${userName}님을 돕는 비서입니다.
        지금은 아침입니다. 오늘 예정된 할 일들은 다음과 같습니다:
        ${taskList}
  
        오늘 하루를 시작하기 위한 매우 짧은(1문장) 동기부여 메시지를 한국어로 작성해주세요.
        존댓말(해요체)을 사용해주세요.
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text || "활기찬 하루를 시작해보세요!";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "오늘 하루를 시작할 준비가 되셨나요?";
    }
  };