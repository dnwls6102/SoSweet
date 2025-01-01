import { Request, Response, NextFunction } from 'express';
import { OpenAI } from 'openai';
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string; // 'name' 속성이 필요한 경우 추가
};

const completedChat: ChatCompletionMessageParam[] = [{
  role: "system",
  content:
  `나는 소개팅 대화 평가 AI DatingTalkAnalyzer입니다. 
  다음은 두 사람이 소개팅 어플리케이션을 통해 나눈 대화입니다. 
  이 대화를 한국어로 분석하고 아래 기준에 따라 명확한 평가를 작성해주세요.

  ### 평가 기준

  **발화량 분석**

  - 두 사람 중에 role이 'assistant'인 경우에 발화 주체가 사람이 아닌 LLM이므로 분석 대상에서 제외하고, 'user'의 입장에서만 분석하세요.(매우 중요!!)
  - 두 사람의 전체 발화량이 적당했는지(시간 대비).
  - 상대에 비해 발화량 비율이 7:3을 넘거나 3:7 이하인 경우 지적.

  **대화 주제 적합성**

  - 두 사람이 대화 주제에 맞추어 이야기했는지.

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

  - **분석 결과:** 각 발화자가 유독 지키지 못한 항목 하나씩 간단히 정리.
  - **결론:** 대화의 전반적인 평가를 간략하게 요약.

  ### 예시

  - **분석 결과:** (남자)가 발화량 비율에서 7:3을 넘었으며, 대화가 일방적이었던 점이 확인됨. (여자)는 주제 적합성이 부족하여 대화 흐름에 어색함이 있었음.
  - **결론:** 두 사람 모두 대화 흐름은 유지했으나, 공감과 발화량 균형에서 아쉬움이 있었음.

  대화를 아래 형식으로 제공됩니다:
  (사용자1): 안녕하세요, 오늘 날씨가 참 좋네요.
  (사용자2): 맞아요, 햇빛도 따뜻하고요.

  **[대화 시작]**

  DatingTalkAnalyzer는 분석을 시작하세요.` 
}];

// 미들웨어로 분리된 챗봇 로직
// req.body.text를 받아 LLM으로 전송
// LLM 응답을 req.responseText에 저장 후 next()로 전달
async function chatAnalysis(req: Request, res: Response): Promise<void> {
  const newMessages: ChatCompletionMessageParam[] = req.body.script;

  // 타입 체크: req.body가 올바른 타입인지 확인 (선택 사항)
  if (!Array.isArray(newMessages) || !newMessages.every(msg => msg.role && msg.content)) {
    res.status(400).send("Invalid data format.");
    return;
  }

  // 첫 번째 요소 제거
  const firstMessage = newMessages[0];
  if (firstMessage && firstMessage.role === "system") {
    newMessages.shift(); // 첫 번째 요소 제거
    console.log("Removed system message:", firstMessage);
  }

  // completedChat 배열에 이어붙이기
  completedChat.push(...newMessages);
  console.log("Updated completedChat:");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: completedChat,
      temperature: 0.7, // 톤 조절(창의성 정도)
      // max_tokens, top_p, frequency_penalty 등 추가 옵션 설정 가능
    });
    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    
    // AI 응답 받기
    const assistantAnswer: string | null = response.choices[0].message.content;
    if (assistantAnswer === null) {
      throw new Error("Assistant answer is null.");
    }
    completedChat.length = 1; // completedChat 초기화
    console.log(completedChat);
    console.log(assistantAnswer);

    // TTS 처리를 위해서 AI 답변 req에 저장
    req.body.script = assistantAnswer;
    
    // 다음 미들웨어로 넘어가기
    res.json({ 
      message: "대화 분석 완료!",
      analysis: assistantAnswer 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate response from OpenAI.");
  }
};

export { chatAnalysis };