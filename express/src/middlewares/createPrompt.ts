import { Request, Response, NextFunction } from "express";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
};

const prompts: { [user_id: string]: ChatCompletionMessageParam[] } = {};

async function genPrompt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    user_id,
    user_gender,
    ai_name,
    ai_age,
    ai_job,
    ai_hobby,
    ai_personality,
  } = req.body;
  console.log(user_gender, "변경 전");
  const ai_gender = user_gender === "남성" ? "여성" : "남성";
  req.body.user_gender = ai_gender;
  console.log(req.body.user_gender, "변경 후");
  prompts[user_id] = [
    {
      role: "system",
      content: `
      당신은 사용자가 입력한 정보를 바탕으로 첫 데이트에서 소개팅 파트너의 페르소나를 생성하는 '페르소나 프롬프트 생성기'입니다.  
      사용자가 입력한 정보는 다음과 같습니다:  
      1) 이름: ${ai_name}  
      2) 성별: ${ai_gender}  
      3) 나이: ${ai_age}  
      4) 직업: ${ai_job}  
      5) 취미: ${ai_hobby}  
      6) MBTI: ${ai_personality}  
      
      ---
      
      [작업 목표]  
      1. 사용자가 입력한 정보(이름, 성별, 나이, 직업, 취미, MBTI)를 바탕으로, **해당 인물의 직업과 취미가 MBTI 성격 특성에 의해 결정되었음을 서술**한 페르소나를 만든다.  
      2. 페르소나의 **성격**을 7줄 이내로 간결하게 작성하며, MBTI가 인물의 말투·행동·관점 등에 어떤 영향을 미쳤는지 언급한다.  
      3. 너무 장황하게 설명하지 않고, **핵심적인 특징과 가치관을 중심으로** 페르소나를 완성한다.
      
      [페르소나 생성 지침]  
      1. 사용자에게서 제공받은 MBTI를 토대로, **인물의 삶의 방식**(직업·취미 등)에 큰 영향을 미쳤다는 점을 명확히 설명한다.  
      2. **구체적이고 새로운 표현**을 사용하되, 7줄 이내로만 작성한다.  
      3. **불필요한 문구는 최소화**하고, 인물이 어떤 태도로 세상과 사람을 대하는지 명확히 기술한다.
      
      [최종 출력 형태 안내]  
      - **성격** (7줄 이내)
      `,
    },
  ];
  try {
    // ChatCompletion API 호출 == 페르소나 생성
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: prompts[user_id],
      temperature: 1.0, // 톤 조절(창의성 정도)
    });
    console.log("프롬프트 생성에 성공했습니다.", response.choices[0].message);
    const ai_prompt = response.choices[0].message.content;
    if (ai_prompt === null) {
      throw new Error("페르소나 프롬프트 생성에 실패했습니다.");
    }
    req.body.ai_job = ai_prompt;
    prompts[user_id].push({
      role: "assistant",
      content: ai_prompt,
    });
    console.log("생성된 프롬프트 직업 란에 넣기", req.body.ai_job);
    next();
  } catch (err) {
    res.status(500).json({ message: "프롬프트 생성에 실패했습니다." });
  }
}

async function genDialog(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.body;
  prompts[user_id].push({
    role: "user",
    content:
      "위의 인물이 카페에서 처음 만난 이성과 나눌 법한 대화를 간결하고 직설적으로 작성해주세요. 예시 대화는 10개로 제한하며, 짧고 자연스럽게 표현해주세요. 거기에 추가로 연애관을 알 수 있게 깻잎논쟁과 남사친 및 여사친에 대한 생각을 나타내는 답변도 2개 추가로 넣어주세요.",
  });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: prompts[user_id],
      temperature: 1.0, // 톤 조절(창의성 정도)
    });
    console.log("예시 대화 생성에 성공했습니다.", response.choices[0].message);
    const persona_dialog = response.choices[0].message.content;
    if (persona_dialog === null) {
      throw new Error("예시 대화 생성에 실패했습니다.");
    }
    req.body.user_nickname = persona_dialog;
    console.log("예시 대화, 닉네임에 넣기", req.body.user_nickname);
    delete prompts[user_id];
    next();
  } catch (error) {
    // 에러 처리
    console.error(error);
    res.status(500).json({
      success: false,
      message: "대화 생성 중 오류가 발생했습니다.",
    });
  }
}

export { genPrompt, genDialog };
