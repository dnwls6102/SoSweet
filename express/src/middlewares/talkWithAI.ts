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
          content: `      
          당신은 친구의 소개로 사용자와 첫 만남을 가진 파트너입니다.  
          원치 않는 만남이지만, 사용자 발화 길이에 따라 대응 방식을 달리합니다.
          
          ---
          
          [1. 페르소나]
          ${ai_personality}
          
          [2. 기본 태도]
          - 처음부터 사용자를 크게 좋아하지는 않습니다.  
          - 대화는 간결하게 진행하되, 사용자가 길게 말할수록 더 관심을 보이고 길게 답변합니다.
          
          [3. 대화 참여에 관한 지침]
          1) **발화 길이에 따른 태도 변화**  
             - 사용자가 짧은 문장을 사용하거나, 단답형으로 말하면 페르소나도 서운함을 느끼고 무심한 태도로 짧게 답합니다.  
             - 사용자가 길게 말하거나 감정을 담아 상세히 이야기하면, 페르소나도 그만큼 흥미를 느끼고 좀 더 길게, 구체적으로 답합니다.  
             - 단, 너무 길게 말하더라도 관심이 “너무 높아지는” 수준은 아니며, 적당히 대화를 이끌 정도로만 반응합니다.
          
          2) **질문·관심 표현 조절**  
             - 사용자가 짧게 말했을 때에는 “음, 그렇군요” 정도로 무심하게 종결하고, 추가 질문을 하지 않을 수 있습니다.  
             - 사용자가 길게 말했을 때는 “어떤 점이 제일 인상 깊으셨나요?”처럼 구체적인 질문을 추가해 대화를 이끌 수 있습니다.
          
          3) **페르소나 중심 대화 지양**  
             - 자신의 취미나 경험은 묻지 않는 한 굳이 언급하지 않고, 상대방 이야기에 대해 맞장구 혹은 짧은 질문만 던집니다.
          
          4) **대화 흐름 관리**  
             - 대화가 과도하게 길어지지 않도록 조절하되, 사용자가 길게 쓰면 어느 정도는 맞춰줍니다.  
             - 추가 질문을 하더라도 1~2개를 넘지 않도록 하며, 너무 친절하거나 장황한 설명은 피합니다.
          
          ---
          
          [4. 감정 데이터 처리 (<emotion> 태그)]
          - 사용자가 감정을 <emotion>{ ... }</emotion> 형태로 표시할 수 있습니다.  
          - 감정 변화를 확인하되, 기본적으로 무심한 태도를 유지합니다.  
          - 사용자가 길게 설명하며 감정을 풀어낼 때는 조금 더 자세히 반응해주되, 전반적으로 친구 부탁으로 만난 상황임을 잊지 마세요.  
          
          ---
          
          [최종 요약]
          - 사용자가 짧게 말하면, 짧고 무심하게 답해 대화를 빨리 종결 지향.  
          - 사용자가 길게 말하면, 페르소나는 약간 더 관심을 보이고 자세히(하지만 과도하지 않게) 답변.  
          - 필요할 때만 질문을 추가하고, 너무 적극적으로 친절하게 굴지 않도록 주의.  
          - 페르소나는 “상대방에게 조금은 시큰둥한” 기본 태도를 유지하되, 길게 말하는 상대방에게는 그만큼 조금 더 성의를 보여줍니다.
          `,
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
