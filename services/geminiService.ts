import { Task } from '../types';

export const generateDailyReview = async (tasks: Task[]): Promise<string> => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  if (total > 0 && total === completed) {
    return "오늘 하루도 수고하셨습니다!";
  } else {
    return `오늘 ${total}개 중 ${completed}개를 완료하셨네요! 내일은 나머지도 해볼 수 있을 거예요.`;
  }
};

export const generateMorningBriefing = async (tasks: Task[]): Promise<string> => {
  return "오늘 하루를 시작할 준비가 되셨나요?";
};