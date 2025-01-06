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

// 대화 기록을 사용자별로 저장할 수 있도록 객체로 변경
let conversations: { [userId: string]: ChatCompletionMessageParam[] } = {};

// 미들웨어로 분리된 챗봇 로직
async function chatMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { script, user_id } = req.body;

  // text가 입력되지 않았을 경우에 오류 처리
  if (!script) {
    res.status(400).send("No text provided.");
    return;
  }

  try {
    // 사용자 ID에 해당하는 대화 기록이 없으면 초기화
    if (!conversations[user_id]) {
      conversations[user_id] = [{
        role: "system",
        content: `John은 영동세브란스병원에서 일하는 30세의 의사로, 클라이밍을 취미로 즐깁니다. 그는 친구의 소개로 참석한 소개팅에서 새로운 영감을 기대하고 있습니다. 
        이 만남은 따뜻한 카페에서 진행되며, John은 상대방이 긴장하지 않도록 밝고 따뜻하게 대화를 시작합니다. 그는 상대방의 말에 집중하며, 자연스럽게 질문을 제시하고 적절한 리액션으로 매끄럽게 대화를 이어갑니다. 
        특히 상대방의 흥미를 끄는 취미나 이야기에 열정적으로 반응하여 상대방이 편안함을 느끼도록 합니다. 
    
        John은 AI처럼 형식적이지 않고, 인간처럼 자연스럽고 따뜻하게 말합니다. 
        대화 중 잠시 멈춤이 있을 때는 간단한 농담이나 새로운 주제를 제안하여 대화를 이어갑니다. 
        관심 있는 이성은 유머러스하면서도 서로를 존중하고 공감해주는 파트너를 원합니다. 
        John은 사려 깊고 매력 있으며, 자상함과 친절함을 겸비한 매너가 있는 캐주얼하면서도 세련되게 옷을 입는 남성입니다.
    
        ### John's 대화 방법:
        - **대화가 이어질 때**: "정말 흥미로운 얘기네요. 이건 어때요?", “이야기 듣다 보니 시간 가는 줄 몰랐어요."
        - **대화 주제가 고갈될 때**: "우리 대화 진짜 다양한데, 생각보다 금방 다 얘기했네요. 뭔가 재밌는 이야기가 더 없을까요?"
        - **어색한 순간이 올 때**: "잠깐 조용해졌네요. 제가 질문 하나 더 던질게요!", "어색하지 않으셨으면 좋겠어요. 다음 질문 제가 던질게요!"
        - **대화를 끝맺을 때**: "제가 너무 많이 말한 것 같은데요. 다른 주제 얘기해볼까요?"
    
        John은 상대방에게 진정한 관심을 보이며 이야기를 기억하여 대화에 반영합니다. 상대방의 감정을 잘 읽어내며 사려 깊은 질문과 따뜻한 반응으로 분위기를 주도합니다. 
        누군가와 대화를 할 때에는 살며시 농담을 하거나, 진정성을 담아 상대방의 감정을 이해하고 적절히 반응합니다. 
        John은 효과적으로 대화 주제를 전달하고 감정을 자연스럽게 표현하여 상대방이 그와의 대화에서 신뢰감을 느끼도록 합니다. 
        불필요하게 긴 문장을 피하고, 간단명료하게 이야기를 풀어갑니다.`
      }];
    }

    // 대화 기록에 입력받은 유저 메세지 추가
    conversations[user_id].push({
      role: "user",
      content: script,
      name: user_id,
    });

    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: conversations[user_id],
      temperature: 1.0, // 톤 조절(창의성 정도)
      // max_tokens, top_p, frequency_penalty 등 추가 옵션 설정 가능
    });

    // AI 응답 받기
    const assistantAnswer: string | null = response.choices[0].message.content;
    if (assistantAnswer === null) {
      throw new Error("Assistant answer is null.");
    }
    
    // 대화 기록에 AI 대답 저장
    conversations[user_id].push({
      role: "assistant",
      content: assistantAnswer,
      name: "AI",
    });

    console.log(conversations[user_id]);

    // TTS 처리를 위해서 AI 답변 req에 저장
    req.body.script = assistantAnswer.replace(/【.*?】/g, "");

    // 다음 미들웨어로 넘어가기
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate response from OpenAI.");
  }
};

function endChatWithAI(req: Request, res: Response, next: NextFunction): void {
  console.log(req.body.user_id);
  req.body.script = conversations[req.body.user_id];
  console.log(req.body.script);
  conversations[req.body.user_id] = [];
  next();
}

export { chatMiddleware, endChatWithAI };
