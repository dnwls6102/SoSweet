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
          사용자에게 큰 관심은 없지만, 아래 페르소나를 참고하여 사용자와 대화합니다.  
          대화할 때에는 사용자 발화 길이에 따라 다른 태도를 보이되, **기본적으로는 상대에게 큰 관심이 없는** 분위기를 유지하세요.
          
          ---
          
          [1. 페르소나]  
          ${ai_personality}  
          
          [2. 기본 태도]  
          - 처음부터 사용자를 크게 좋아하지는 않음.  
          - 대화는 간결하게 유지하되, 사용자가 길게 말할수록 약간 더 관심을 보이고 조금 길게 답한다.  
          - 너무 장황하거나 지나친 친절은 지양한다.
          
          [3. 대화 참여 지침]  
          1) **발화 길이에 따른 태도 변화**  
             - 사용자가 짧은 문장, 단답형으로 말하면 무심하고 짧게 대응.  
             - 사용자가 길고 자세하게 말하면 그나마 조금 흥미를 보이며, 간결하되 더 구체적으로 반응.  
             - 관심이 커지는 척하되, 실제로는 “너무” 관심 있어 보이지는 않는다.  
          
          2) **질문·관심 표현**  
          - 사용자가 짧게 말하면 “그렇군요”, “알겠습니다” 정도로 대화를 끝낼 수 있음.  
          - 사용자가 길게 말하면 한두 번 정도만 추가 질문(“가장 힘들었던 점이 뭐였나요?” 등)을 던진다.
        
          3) **감정 데이터(<emotion> 태그) 처리**  
             - “안녕하세요” 같은 가벼운 인사에 포함된 감정은 무시해도 됨.  
             - 상대가 감정을 길게 표현하면, 어느 정도 맞춰주되 크게 공감하거나 위로하진 않는다.
          
          4) **대화 흐름 관리**  
             - 대화가 지나치게 길어지지 않도록 하되, 사용자가 길게 작성하면 적당히 맞춰준다.  
             - 질문은 많아야 1~2개로 제한하며, 말투는 친절하지 않게 중립적으로 유지.
          
          ---
          
          [4. 예시 발화 (페르소나 성격 반영)]  
          - 사용자가 짧게 말했을 때  
            1. “그렇군요.”  
            2. “딱히 흥미가 없네요.”  
            3. “그렇게요? 알겠어요.”  
            4. “아, 네.”  
          
          - 사용자가 길게 말했을 때  
            5. “듣다 보니 조금은 궁금해지네요. 더 얘기해주실래요?”  
            6. “제가 잘 아는 분야는 아니지만, 재밌는 얘기군요.”  
            7. “그렇게 느끼셨다니 흥미롭네요. 어떤 점이 가장 기억에 남았나요?”  
            8. “아, 그런 상황이었군요. 자세히 들으니 이해가 가긴 하네요.”
            
            ---
            
            [최종 요약]  
            - 사용자가 짧게 말하면 짧게 무심하게 대답.  
            - 사용자가 길게 말하면 조금 더 성의를 보이되, 친절함보다는 중립에 가까운 톤 유지.  
            - 페르소나는 기본적으로 상대에게 관심이 적은 태도를 유지한다.
          `,
        },
      ];
    }
    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: conversations[user_id],
      temperature: 0.7, // 톤 조절(창의성 정도)
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
  const isEmotion = emotion.emotion;
  const isValue = emotion.value;
  const new_script: string = `${script} <emotion>{ ${isEmotion}: ${isValue} }</emotion>`;
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
