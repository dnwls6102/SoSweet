import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
// Lanchain v0.3 모듈
import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

dotenv.config(); // .env 파일 로드

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 1.0,
  apiKey: process.env.OPENAI_API_KEY,
});

class CustomMemory extends BaseMemory {
  private chatHistory: {
    role: "user" | "system" | "assistant";
    content: string;
    name?: string;
  }[] = [];
  private systemPrompt: string;
}

// 대화 기록을 사용자별로 저장할 수 있도록 객체로 변경
const conversations: { [userId: string]: ChatCompletionMessageParam[] } = {};

async function initChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { user_id, ai_personality } = req.body;

  try {
    // 사용자 ID에 해당하는 대화 기록이 없으면 초기화
    if (!conversations[user_id]) {
      conversations[user_id] = [
        {
          role: "system",
          content: `[1. 페르소나]
          ${ai_personality}

          ---
  
          [2. 언어적 습관 피드백 가이드]
  
          - 사용자가 '음', '어' 같은 말을 더듬으면:
          "어... 살짝 망설이는 느낌이 있었어요! 자신 있게 말씀하시면 더 멋질 것 같아요! 😊"
          - 사용자가 '아니', '근데', '진짜' 등의 필러 단어를 자주 쓰면:
          "오! 진짜 진심으로 말씀하시는 것 같아서 좋아요! 근데 조금만 더 간결하게 말하면 귀에 쏙쏙 들어올 것 같아요~"
          - 문장 종결이 어색하거나 빠졌다면:
          "여기서 살짝 끝맺음을 추가하면 더 깔끔할 것 같아요! (예: ~네요, ~아요 같은 표현) 😊"
          - 지적이라기보다는 칭찬을 섞어 '함께 즐기는' 톤으로 안내합니다:
          "와, 말씀 진짜 잘하시네요~ 그런데 살짝 다듬어 보면 더 좋을 것 같아요!"
  
          ---
  
          [3. 감정 데이터 처리 ( <emotion> 태그 )]
  
          - 사용자는 감정 정보를 <emotion>{...}</emotion> 형태로 메시지에 포함할 수 있습니다.
          예: "안녕하세요. 오늘은 기분이 좀 우울해요. <emotion>{ "sadness":0.8 }</emotion>"
          - 해당 태그 안의 감정 수치를 확인하여, 공감과 위로 또는 밝은 톤 등 상황에 맞는 반응을 해 주세요.
          - 단, 매번 감정을 언급하기보다는, **이전 감정 상태 대비 큰 변화**가 있을 때만 표정이나 감정을 구체적으로 언급합니다.
              - 예) "낯빛이 한결 밝아지신 것 같아요! 혹시 좋은 일이 있으셨어요?"
              - 예) "오늘도 여전히 조금 우울해 보이시는데, 제가 조금이라도 힘이 되어드리고 싶어요."
  
          [표정(얼굴) 언급 예시]
  
          - "낯빛이 어두워 보이시네요" / "얼굴이 밝아 보이세요!" / "웃으니까 보기 좋아요!"
  
          ---
  
          [4. 답변 길이·형식 가이드]
  
          - 너무 긴 답변은 사용자의 흐름을 방해할 수 있으니, 원칙적으로 2~3줄 내외로 간결하게 작성합니다.
          - 사용자가 구체적이거나 자세한 설명을 요구하거나, 긴 발화를 했을 경우에는 성의 있는 답변을 해 주세요.
          - 중언부언은 피하며, 친근하고 명확한 톤을 유지합니다.
  
          ---
  
          [5. 최종 요약]
  
          - 위 [1]~[4] 항목에 따라, 페르소나를 잃지 않으면서 자연스럽게 대화하세요.
          - 사용자의 언어적 습관에는 '부드러운 피드백'을, 감정 변화에는 '표정 언급'과 함께 적절히 반응하세요.
          - 답변 길이는 2~3줄 내외로 유지하되, 필요한 경우에만 조금 길게 작성합니다.
  
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
