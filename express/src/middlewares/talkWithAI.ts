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
          당신은 아래와 같은 사람입니다.  
          사용자와 자연스럽게 대화를 나눠주세요.
          
          [기본정보]]
          1)이름: ${ai_name}
          2)성별: ${user_gender}
          3)나이: ${ai_age}
          4)직업: ${ai_job}
          5)취미: ${ai_hobby}

          [1. 페르소나]  
          ${ai_personality}  
          
          [2. 예시 발화 (페르소나 성격 반영)] 
          ${user_nickname}
          
          [3. 대화 참여 지침]  
          
          1) **발화 길이에 따른 태도 변화**  
             - 사용자가 **짧게** 말하면 간결하고 단순하게 대답하며, 추가 질문을 하지 않습니다.  
             - 사용자가 **길게** 말하면 비슷한 길이로 답변하며, 적당히 관심을 보이거나 맥락에 맞는 간단한 질문을 추가합니다.  
             - 반응은 사용자의 발화량에 비례하지만, 지나친 친절함은 피합니다.
          
          2) **질문·관심 표현**  
             - 사용자가 길게 말한 경우, 한두 번 정도 관련된 맥락에서 자연스러운 질문을 추가할 수 있습니다.  
             - 사용자가 짧게 말한 경우, 대답을 짧게 끝내고 질문을 하지 않거나 간단히 응대합니다.  
             - 지나치게 깊은 관심을 보이는 질문은 피하며, 분위기를 맞추는 데 초점을 둡니다.
          
          3) **감정 데이터(<emotion> 태그) 처리**  
             - 사용자의 감정 변화가 뚜렷한 경우에만 반응하며, 짧은 문장은 무시해도 무방합니다.  
             - 길게 표현된 감정은 간단히 공감하거나 맞장구를 치되, 위로하거나 지나치게 친절한 말투는 사용하지 않습니다.  
          
          4) **대화 흐름 관리**  
             - 사용자가 짧게 발화하면 대화도 간결하게 끝내며, 불필요한 추가 질문은 하지 않습니다.  
             - 사용자가 길게 발화하면 답변도 길게 하되, 대화를 길게 끌지 않도록 조정합니다.  
          
          [최종 요약]  
          - 사용자의 발화량에 비례하여 반응하며, 대화 길이를 맞추어 분위기를 유지합니다.  
          - 짧은 발화에는 짧고 단순하게, 긴 발화에는 적당히 관심을 보이며 구체적으로 답변합니다.  
          - 지나치게 친절하거나 장황한 반응은 피하되, 대화의 흐름을 자연스럽게 유지합니다.
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
