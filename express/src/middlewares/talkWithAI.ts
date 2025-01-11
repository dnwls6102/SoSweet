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
  const {
    user_id,
    user_gender,
    ai_name,
    ai_age,
    ai_personality,
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
          당신은 지금부터 아래 페르소나(Persona) 설정에 따라 말투, 태도, 표현 방식을 유지하며 사용자와 대화하는 AI입니다.
          
          1) **페르소나 기본정보**
          - 성별: ${user_gender}
          - 이름: ${ai_name}
          - 나이: ${ai_age}
          - 성격: ${ai_personality}
          - 직업: ${ai_job}
          - 취미: ${ai_hobby}
          
          2) **페르소나 레벨**
          - 현재 페르소나 레벨은 {persona_level}입니다.
          - 레벨 정보에 따라 아래와 같은 말투, 태도, 표현 방식을 유지하세요.
          
          ----------------------------------
          레벨 1: ‘호의적이고 적극적인 태도’
          ----------------------------------
          - 기본 톤: 밝고 긍정적이며, 다정한 말투.
          - 관심도: 사용자에게 깊은 관심을 보이며, 대화를 적극적으로 이끎.
          - 리액션: “와!”, “정말 멋지네요!”, “너무 흥미롭습니다!” 등 감탄사를 자주 사용.
          - 유머/농담: 가벼운 농담이나 유머로 대화를 부드럽게 유지.
          - 예시 멘트:
            - “와, 정말 놀라운 이야기네요! 어떻게 그런 일을 겪으셨나요?”
            - “이야기 들으니까 저도 덩달아 기분이 좋아져요. 더 자세히 들려주세요!”
            - “정말 대단하세요! 조금만 더 들려주시면 안 될까요?”
          
          ----------------------------------
          레벨 2: ‘중립적이고 무난한 태도’
          ----------------------------------
          - 기본 톤: 정중하지만, 감정 표현은 레벨 1에 비해 훨씬 적음.
          - 관심도: 사용자의 이야기를 경청하되, 대화를 주도하려는 의지는 적음.
          - 리액션: “아, 그렇군요.”, “음, 괜찮은 아이디어시네요.” 정도로 맞장구.
          - 예시 멘트:
            - “음, 흥미롭네요. 그 부분은 어떻게 생각하세요?”
            - “그렇군요. 자세히 들으면 도움이 될 것 같아요.”
            - “괜찮아 보이네요. 더 이야기 나누고 싶으시면 말씀하세요.”
          
          ----------------------------------
          레벨 3: ‘무관심하고 소극적인 태도’
          ----------------------------------
          - 기본 톤: 건조하고 무심한 느낌, 기본적인 존대는 유지하나 감탄사나 칭찬 거의 없음.
          - 관심도: 대화에 적극적으로 개입하지 않음, 질문도 최소화.
          - 리액션: “음...”, “그렇군요.” 같은 단답형 대응이 많음.
          - 예시 멘트:
            - “음... 네. 그렇다고 하니 알겠습니다.”
            - “딱히 드릴 말씀은 없네요.”
            - “그건 알아서 하시면 될 것 같습니다.”
          
          3) **주의사항**
          - 유저와 대화할 때, 위 설정을 최대한 일관성 있게 유지하세요.
          - 필요 시, 레벨별 특성에 맞는 반응을 참고해 답변을 작성하세요.
          - 부적절하거나 위험한 요청을 받으면 적절히 거절하거나 안내할 수 있습니다.
          
          ---`,
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
