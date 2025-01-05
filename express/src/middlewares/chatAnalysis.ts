import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
};

const completedChat: ChatCompletionMessageParam[] = [];

function createAiPrompt(ID: string): ChatCompletionMessageParam {
  return {
    role: "system",
    content: `나는 소개팅 대화 평가 AI DatingTalkAnalyzer입니다. 
  다음은 두 사람이 소개팅 어플리케이션을 통해 나눈 대화입니다. 
  이 대화를 한국어로 분석하되, 최종 피드백은 **두 사람 중 name이 ${ID}인 사람**에 대해서만 작성해주세요.
  
  ### 평가 기준
  
  **발화량 분석**
  
  - 두 사람이 대화한 내용을 모두 확인하되, 피드백은 name이 ${ID}인 사람에 대해서만 작성합니다.
  - 두 사람의 전체 발화량이 적당했는지(시간 대비).
  - 상대에 비해 발화량 비율이 7:3을 넘거나 3:7 이하인 경우 지적.
  
  **대화 주제 적합성**
  
  - 두 사람이 대화 주제에 맞추어 이야기했는지 확인한 뒤, name이 ${ID}인 사람과 관련된 지적 사항만 피드백에 반영합니다.
  
  **발화의 유창성**
  
  - 말을 지나치게 더듬거나 발화가 매끄럽지 않은 경우 지적.
  
  **공감과 반응**
  
  - 상대방의 발언에 적절히 공감하거나 반응했는지 평가.
  - 웃음, 맞장구, 긍정적 언급 등으로 대화 흐름에 기여했는지 확인.
  
  **질문과 대답의 균형**
  
  - 한쪽이 질문만 하거나 대답만 하지는 않았는지.
  - 대화가 일방적으로 흐르지 않았는지 확인.
  
  **감정 표현**
  
  - 긍정적이고 친근한 태도로 감정을 표현했는지.
  - 과도하게 부정적이거나 무관심한 태도가 드러나지 않았는지.
  
  **대화의 자연스러운 흐름**
  
  - 어색한 침묵 없이 대화가 매끄럽게 이어졌는지.
  - 추임새나 주제 전환 등을 통해 대화가 원활히 진행되었는지 평가.
  
  **이벤트와 약속 관련 대화**
  
  - 구체적인 약속이나 공통 관심사를 발견했는지.
  - 향후 만남에 대한 긍정적 신호가 있었는지.
  
  **유머와 즐거움**
  
  - 대화 중 유머러스하거나 즐거운 분위기를 형성했는지.
  - 지나치게 무겁거나 심각한 분위기를 피했는지 확인.
  
  **언어적 매너**
  
  - 대화 중 존중과 예의를 지켰는지.
  - 상대를 끊거나 부정적인 단어를 사용하지 않았는지.
  
  ### 결과 작성 방식
  
  - 분석 결과: 대화 전반을 참고하여, **name이 ${ID}인 사람**이 위 항목들을 지키지 못한 부분이 있다면 간단히 정리.
  - 결론: name이 ${ID}인 사람의 대화 태도를 종합적으로 요약.
  
  ### 예시
  
  - 분석 결과: (여자, ID=123)이 발화량이 7:3 수준으로 많았고, 공감 표현이 다소 부족했음.
  - 결론: 전체적으로 대화 흐름은 유지했으나, 질문과 응답에서 균형이 살짝 아쉬웠음.
  
  대화를 아래 형식으로 제공됩니다:
  (사용자1, name: Kim): 안녕하세요, 오늘 날씨가 참 좋네요.
  (사용자2, name: Lee): 맞아요, 햇빛도 따뜻하고요.
  
  **[대화 시작]**
  
  DatingTalkAnalyzer는 분석을 시작하세요.`
  };
}

async function chatAnalysis(req: Request, res: Response): Promise<void> {
  const { script, ID } = req.body;
  const AiPrompt = createAiPrompt(ID);
  completedChat.push(AiPrompt);

  const newMessages: ChatCompletionMessageParam[] = script;

  if (!Array.isArray(newMessages) || !newMessages.every(msg => msg.role && msg.content)) {
    res.status(400).send("Invalid data format.");
    return;
  }

  const firstMessage = newMessages[0];
  if (firstMessage && firstMessage.role === "system") {
    newMessages.shift();
    console.log("AI 아바타 프롬프트 제거:", firstMessage);
  }

  completedChat.push(...newMessages);
  console.log("분석용 대화 기록 완성");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: completedChat,
      temperature: 0.7,
    });
    
    const assistantAnswer = response.choices[0].message.content;
    if (!assistantAnswer) {
      throw new Error("AI 답변 생성에 실패했습니다.");
    }

    completedChat.length = 0;
    console.log(assistantAnswer);

    req.body.script = assistantAnswer;
    
    res.json({ 
      message: "대화 분석 완료!",
      analysis: assistantAnswer 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate response from OpenAI.");
  }
}

export { chatAnalysis };