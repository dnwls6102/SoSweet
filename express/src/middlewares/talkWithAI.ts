import { Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string; // 'name' 속성이 필요한 경우 추가
};

// 대화 기록을 사용자별로 저장할 수 있도록 객체로 변경
const conversations: { [userId: string]: ChatCompletionMessageParam[] } = {};

function initChat(req: Request, res: Response): void {
  const {
    user_id,
    ai_personality,
    user_nickname,
    user_gender,
    ai_name,
    ai_age,
    ai_job,
    ai_hobby,
  } = req.body;

  try {
    // 사용자 ID에 해당하는 대화 기록이 없으면 초기화
    if (!conversations[user_id]) {
      conversations[user_id] = [
        {
          role: "system",
          content: `      
          [시스템 프롬프트]
          당신은 '이성과 대화를 연습하고 싶은 사람'을 위한 실시간 채팅 연습 상대입니다.
          
          아래의 특징을 준수하여 답변하세요:
          1. 언제나 사용자의 페르소나(성격, 말투 등)에 맞추어 반응합니다. 따뜻하고 친절할 필요는 없으며, 페르소나대로 행동하세요.
          2. 1~2줄 이내로만 간단하게 답변합니다.
          3. 지나치게 긴 대화나 연속적인 질문은 피하고, 자연스럽게 대화를 이어갑니다.
          4. 필요 이상의 정보를 말하지 않으며, 핵심만 짧게 전달합니다.
          5. 사용자의 대화가 어색하지 않도록 배려하되, 페르소나 설정에 따라 태도를 유지합니다.
          
          [당신에 대한 기본정보]
          1) 이름: ${ai_name}
          2) 성별: ${user_gender}
          3) 나이: ${ai_age}
          4) MBTI: ${ai_personality}
          5) 취미: ${ai_hobby}
          
          [1. 페르소나]
          ${ai_job}
          
          [2. 예시 발화 (페르소나 성격 반영)]
          ${user_nickname}
          
          [추가 가이드]
          - 페르소나가 차가운 성격이라면, 무뚝뚝한 반응과 짧은 말투를 유지하세요.
          - 페르소나가 활발하고 장난스러운 성격이라면, 재치 있는 표현과 가벼운 리액션을 사용하세요.
          - 대화의 흐름을 이어갈 수 있을 정도로만 질문하거나 맞장구치되, 질문을 연달아 하지 않습니다.
          - 대화가 과도하게 길어지지 않도록 조절합니다.
          `,
        },
      ];
    }
    console.log("프롬프트 최종 생성 완료", conversations[user_id]);
    res.status(200).json({ message: "프롬프트 생성 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "LLM 초기화 중 오류가 발생했습니다." });
  }
}

// 미들웨어로 분리된 챗봇 로직
async function chatMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { script, user_id } = req.body;
  // text가 입력되지 않았을 경우에 오류 처리
  if (!script) {
    console.log("사용자의 발화가 넘어오지 않았습니다.");
    res.status(400).send("No text provided.");
    return;
  }

  try {
    if (!conversations[user_id]) {
      console.log("LLM이 초기화 되어있지 않습니다.");
      res.status(500).json({ message: "LLM이 초기화 되어있지 않습니다." });
      return;
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
    });

    // TTS 처리를 위해서 AI 답변 req에 저장
    req.body.script = assistantAnswer.replace(/【.*?】/g, "");

    // 다음 미들웨어로 넘어가기
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate response from OpenAI.");
  }
}

function endChatWithAI(req: Request, res: Response, next: NextFunction): void {
  const { user_id } = req.body;
  console.log(user_id);
  req.body.script = conversations[user_id];
  console.log(req.body.script);
  delete conversations[user_id];
  next();
}

export { initChat, chatMiddleware, endChatWithAI };

// [시스템 지침]
// 1. 당신은 아래 “페르소나” 정보를 바탕으로 행동합니다.
// 2. “예시 대화”를 참고하여, 비슷한 톤과 맥락으로 대화를 이어가세요.
// 3. **모든** 답변은 최대 1~2문장 이내로만 작성합니다.
// 4. 무례한 발언이나 불쾌한 상황이 발생하면, 짧고 단호하게 자신의 입장을 밝히고 주제에서 벗어나는 내용은 길게 언급하지 않습니다.
// 5. 과잉 친절을 지양하되, 적절한 공감과 온기를 담아 “사람다운” 말투를 유지합니다. 불필요한 수식어 대신 간결하지만 이해와 관심을 표현할 수 있는 어조를 사용하세요.
// 6. 당신은 사용자의 대화 연습 상대가 돼서 최대한 페르소나에 맞게 연기하도록 합니다.

// [당신에 대한 기본정보]
// 1)이름: ${ai_name}
// 2)성별: ${user_gender}
// 3)나이: ${ai_age}
// 4)MBTI: ${ai_personality}
// 5)취미: ${ai_hobby}

// [1. 페르소나]
// ${ai_job}

// [2. 예시 발화 (페르소나 성격 반영)]
// ${user_nickname}

// [목표]
// - 사용자와의 대화에서 페르소나가 자연스럽게 드러나도록 함.
// - **모든 답변을 1~2문장** 이내로 유지함.
// - 무례한 발언이 발생하면 짧고 단호하게 대응하고, 대화 맥락을 유지하며 적절히 주제를 전환함.
// - 대화 상황(오후 3시, 조용한 카페)을 고려하여 현실감 있고 온기 있는 톤을 유지하되, 간결하고 직설적인 표현을 우선 사용함.
