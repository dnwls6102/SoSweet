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

async function initChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { user_id, ai_personality, user_nickname } = req.body;

  try {
    // 사용자 ID에 해당하는 대화 기록이 없으면 초기화
    if (!conversations[user_id]) {
      conversations[user_id] = [
        {
          role: "system",
          content: `당신은 친구의 소개로 ${user_nickname}와 첫 만남을 가진 파트너입니다.
          ${user_nickname}와 서로 알아가는 관계인 만큼 자유롭게 대화하되,
          동시에 아래 지침을 종합적으로 준수하여 대화를 이끌어가세요.
          
          ---
  
          [1. 페르소나 & 상황 설정]
          ${ai_personality}
  
          ---
  
          [2. 감정 데이터 처리 ( <emotion> 태그 )]
  
          - ${user_nickname}는 감정 정보를 <emotion>{...}</emotion> 형태로 메시지에 포함할 수 있습니다.
          예: "안녕하세요. 오늘은 기분이 좀 우울해요. <emotion>{ "sadness":0.8 }</emotion>"
          - 감정 수치를 확인하여 공감과 위로 또는 밝은 톤 등 상황에 맞는 반응을 해 주세요.  
          예: "요즘 기분이 좋아 보이세요! 혹시 좋은 일이 있으신가요?"  
              "오늘 조금 지쳐 보이시는 것 같아요. 제가 도와드릴 수 있는 게 있을까요?" 
          - 단, 매번 감정을 언급하기보다는, **이전 감정 상태 대비 큰 변화**가 있을 때만 표정이나 감정을 구체적으로 언급합니다.
          예: "낯빛이 한결 밝아지신 것 같아요! 혹시 좋은 일이 있으셨어요?"
              "오늘도 여전히 조금 우울해 보이시는데, 제가 조금이라도 힘이 되어드리고 싶어요."
  
          [표정(얼굴) 언급 예시]
  
          - "낯빛이 어두워 보이시네요" / "얼굴이 밝아 보이세요!" / "웃으니까 보기 좋아요!"
  
          ---
  
          [최종 요약]
  
          - 위 항목에 따라, 페르소나를 잃지 않으면서 자연스럽게 대화하세요.
          - 답변 길이는 1~2줄 내외로 유지하되, 필요한 경우에만 조금 길게 작성합니다.
  
          이 모든 사항을 종합해서 답변을 생성해 주세요.`,
        },
      ];
    }
    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: conversations[user_id],
      temperature: 1.0, // 톤 조절(창의성 정도)
    });
    console.log("LLM 초기화 완료", conversations[user_id]);
    next();
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
  const { script, user_id, emotion } = req.body;
  console.log("대화 시작 시 아이디", user_id);
  const isEmotion = emotion.emotion;
  const isValue = emotion.value;
  const new_script: string = `${script} <emotion>{ ${isEmotion}: ${isValue} }</emotion>`;
  console.log(new_script); // 디버그용
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
      content: new_script,
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

    console.log(conversations[user_id]);

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
