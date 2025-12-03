import { GoogleGenAI } from "@google/genai";
import { Task } from '../types';

// Initialize Gemini Client
// IMPORTANT: In a real production app, never expose keys on the client.
// This is for the demo context where process.env.API_KEY is injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDailyReview = async (tasks: Task[], userName: string): Promise<string> => {
  try {
    const completedTasks = tasks.filter(t => t.completed).map(t => `- [Completed] ${t.text} (Memo: ${t.memo})`).join('\n');
    const incompleteTasks = tasks.filter(t => !t.completed).map(t => `- [Not Done] ${t.text}`).join('\n');
    const completionRate = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

    const prompt = `
      You are a friendly, encouraging productivity assistant for ${userName}.
      Analyze today's task list:
      
      ${completedTasks}
      ${incompleteTasks}

      Completion Rate: ${completionRate}%

      Provide a short, warm, and constructive review of the day (max 3 sentences). 
      If the user did well, celebrate it. 
      If they missed tasks, gently encourage them to move forward tomorrow.
      Do not use markdown formatting like bold or italics, just plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Great effort today! Keep pushing forward.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Great job tracking your tasks today!";
  }
};

export const generateMorningBriefing = async (tasks: Task[], userName: string): Promise<string> => {
    try {
      const taskList = tasks.map(t => `- ${t.text}`).join('\n');
      
      const prompt = `
        You are a helpful assistant for ${userName}.
        It is morning. Here are the tasks scheduled for today:
        ${taskList}
  
        Give a very short (1 sentence) motivating remark to start the day.
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text || "Let's have a productive day!";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Ready to tackle the day?";
    }
  };