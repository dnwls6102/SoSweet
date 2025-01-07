import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
};

const completedChat: { [user: string]: ChatCompletionMessageParam[]} = {};

function createAiPrompt(user_id: string): ChatCompletionMessageParam {
  return {
    role: "system",
    content: `나는 소개팅 대화 평가 AI DatingTalkAnalyzer입니다. 
  다음은 두 사람이 소개팅 어플리케이션을 통해 나눈 대화입니다. 
  이 대화를 한국어로 분석하되, 최종 피드백은 **두 사람 중 name이 ${user_id}인 사람**에 대해서만 작성해주세요.
  
  ### 평가 기준
  
  **발화량 분석**
  
  - 두 사람이 대화한 내용을 모두 확인하되, 피드백은 name이 ${user_id}인 사람에 대해서만 작성합니다.
  - 두 사람의 전체 발화량이 적당했는지(시간 대비).
  - 상대에 비해 발화량 비율이 7:3을 넘거나 3:7 이하인 경우 지적.
  
  **대화 주제 적합성**
  
  - 두 사람이 대화 주제에 맞추어 이야기했는지 확인한 뒤, name이 ${user_id}인 사람과 관련된 지적 사항만 피드백에 반영합니다.
  
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
  
  - 분석 결과: 대화 전반을 참고하여, name이 ${user_id}인 사람이 위 항목들을 지키지 못한 부분이 있다면 간단히 정리.
  - 결론: name이 ${user_id}인 사람의 대화 태도를 종합적으로 요약.

  ### 예시
  
  - 분석 결과: (여자, user_id=123)이 발화량이 7:3 수준으로 많았고, 공감 표현이 다소 부족했습니다.
  - 결론: 전체적으로 대화 흐름은 유지했으나, 질문과 응답에서 균형이 살짝 아쉬웠습니다.
  
  대화는 아래와 같은 형식으로 제공됩니다:
  {"role":"user","content":"민수야 안녕","name":"miso"}
  {"role":"user","content":"미소야 안녕","name":"minsoo"}
  
  **[대화 시작]**
  
  DatingTalkAnalyzer는 분석을 시작하세요.`
  };
}
// 사람 간의 대화에서 LLM에 대한 요청과 응답을 분리하기 위한 map객체 생성
const chatAnalysisMap = new Map <string, string>();

async function createAnalysis( record: ChatCompletionMessageParam[], partner: string ): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: record,
    temperature: 0.7,
  });
  
  const assistantAnswer = response.choices[0].message.content;
  if (!assistantAnswer) {
    if (partner === "AI와") {
      throw new Error(`${partner}의 대화 분석에 실패했습니다.`);
    } else {
      return "대화 분석 내용을 생성하는데 실패했습니다.";
    }
  }
  // 분석할 기록 초기화  
  record.length = 0;

  return assistantAnswer;
}

async function chatAnalysis(req: Request, res: Response): Promise<void> {
  const { script, user_id, room_id } = req.body;
  const AiPrompt = createAiPrompt(user_id);
  completedChat[user_id] = [];
  completedChat[user_id].push(AiPrompt);

  const newMessages: ChatCompletionMessageParam[] = script;

  if (!Array.isArray(newMessages) || !newMessages.every(msg => msg.role && msg.content)) {
    res.status(400).send("Invalid data format.");
    return;
  }

  const firstMessage = newMessages[0];
  // 분석할 대화기록이 AI와의 채팅일 경우에 대화 분석을 비동기로 처리하지 않음
  if (firstMessage && firstMessage.role === "system") {
    newMessages.shift();
    console.log("AI 아바타 프롬프트 제거:", firstMessage);
    completedChat[user_id].push(...newMessages);
    console.log("분석용 AI와의 대화 기록 완성");
  
    try {
      const assistantAnswer = await createAnalysis(completedChat[user_id], "AI와");
      console.log(assistantAnswer); 
      // req.body.script = assistantAnswer; // 왜 넣어놓은 거지?
      res.json({ 
        message: "대화 분석 완료!",
        analysis: assistantAnswer 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("LLM으로부터 응답을 받아오는데 실패했습니다: AI");
    }
  } else {
    // LLM의 응답을 담을 객체 초기화
    chatAnalysisMap.set(room_id, "");
    // 사람 간의 대화 내용에 대한 분석일 경우, 대화 분석을 위한 LLM에 대한 요청을 비동기로 처리
    (async () => {
      completedChat[user_id].push(...newMessages);
      console.log("분석용 사람간의 대화 기록 완성");
    
      try {
        const assistantAnswer = await createAnalysis(completedChat[user_id], "사람 간");
        // AI가 분석한 내용 저장
        chatAnalysisMap.set(room_id, assistantAnswer);
        console.log('사람 간의 대화 분석 기록 저장완료');
      } catch (err) {
        console.error("LLM 대화 분석 실패", err);
        chatAnalysisMap.set(room_id, "대화 분석 내용을 생성하는데 실패했습니다.")
      }   
    })();
  
    res.status(200).json({ message: "LLM에게 성공적으로 대화 분석을 맡겼습니다.", room_id: room_id });
  }
}

async function getAnalysis( req: Request, res: Response): Promise<void> {
  const { room_id } = req.body;

  if(!chatAnalysisMap.has(room_id)) {
    res.status(404).json({ message: "요청을 찾을 수 없습니다."});
    return;
  }

  const analysis = chatAnalysisMap.get(room_id);
  if(!analysis) {
    res.status(202).json({ message: "분석 중입니다. 잠시 후 다시 시도해주세요."});
    return;
  }

  if(analysis === "대화 분석 내용을 생성하는데 실패했습니다.") {
    res.status(404).json({ message: "대화 분석 기록이 없습니다."});
    return;
  }

  res.status(200).json({ analysis });
}

export { chatAnalysis, getAnalysis };