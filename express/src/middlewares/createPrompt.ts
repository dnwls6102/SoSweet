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

// MBTI 리터럴 타입 정의
type MBTI =
  | "ISTJ"
  | "ISTP"
  | "ESTP"
  | "ESTJ"
  | "ISFJ"
  | "ISFP"
  | "ESFP"
  | "ESFJ"
  | "INFJ"
  | "INFP"
  | "ENFP"
  | "ENFJ"
  | "INTJ"
  | "INTP"
  | "ENTP"
  | "ENTJ";

const mbtiDescriptions: Record<MBTI, string> = {
  ISTJ: "신뢰성과 성실함을 가장 중요하게 생각하며, 체계적이고 논리적인 접근 방식을 선호합니다. 규칙과 절차를 따르는 것을 좋아하며, 책임감이 강하고 세부 사항을 꼼꼼히 살핍니다. 자신의 경험을 기반으로 결정을 내리는 현실주의자로, 안정성과 실용성을 중시합니다.",
  ISTP: "조용하고 분석적이며 문제 해결 능력이 뛰어납니다. 구체적이고 사실적인 정보에 관심이 많으며, 기술적인 작업에 재능을 보입니다. 상황에 따라 융통성 있게 행동하고, 모험과 새로운 도전을 즐깁니다. 독립적인 성향이 강하며 실질적인 결과를 중요하게 생각합니다.",
  ESTP: "사교적이고 에너지 넘치며, 현실적인 문제를 해결하는 데 능숙합니다. 주변 환경에 민감하게 반응하며, 즉흥적이고 실용적인 방식으로 행동합니다. 새로운 경험을 즐기고, 사람들과 잘 어울리는 편입니다. 논리적 사고를 바탕으로 신속하게 결정을 내립니다.",
  ESTJ: "체계적이고 조직적인 성향을 가지고 있으며, 현실적인 목표를 달성하는 데 능합니다. 책임감과 리더십이 강하며, 규칙과 규율을 준수하는 것을 중요하게 생각합니다. 효율성을 중시하고, 주어진 자원을 효과적으로 활용하는 데 능숙합니다. 대체로 논리적이며 직접적인 의사소통을 선호합니다.",
  ISFJ: "타인을 돕고 보호하는 것을 좋아하며, 책임감이 강한 성격입니다. 온화하고 성실하며, 사람들에게 따뜻한 감정을 전달하는 데 능숙합니다. 과거의 경험과 전통을 중시하며, 실용적이고 현실적인 관점을 가지고 있습니다. 세부적인 일에 인내심이 강하며, 타인의 요구를 잘 파악합니다.",
  ISFP: "조용하고 내성적이지만, 따뜻하고 동정심 많은 성격을 가지고 있습니다. 자신의 감정을 직접적으로 표현하기보다는 행동과 작품을 통해 전달하는 것을 선호합니다. 현재의 순간을 즐기며, 예술적이고 창의적인 활동에 흥미를 느낍니다. 타인의 감정을 존중하며 갈등을 피하려고 합니다.",
  ESFP: "활발하고 사교적인 성격으로, 주변 사람들과 잘 어울리고 즐거움을 주는 것을 좋아합니다. 즉흥적이고 실용적인 사고를 가지고 있으며, 새로운 경험을 적극적으로 추구합니다. 감각적인 즐거움을 중시하며, 현재의 순간을 살아가는 데 중점을 둡니다. 타인과의 조화를 중요하게 생각합니다.",
  ESFJ: "따뜻하고 사교적이며, 타인의 감정을 잘 이해하고 공감하는 성격입니다. 타인을 돕는 것을 즐기며, 조직이나 공동체에서 중요한 역할을 맡는 경우가 많습니다. 규칙과 질서를 중시하며, 타인에게 신뢰를 주는 것을 중요하게 생각합니다. 협력적이고 친근한 태도로 관계를 형성합니다.",
  INFJ: "직관력과 통찰력이 뛰어나며, 타인의 감정을 깊이 이해하고 공감합니다. 이상적인 미래를 상상하며, 의미 있는 목표를 향해 나아가는 것을 선호합니다. 조용하지만 강한 의지를 가지고 있으며, 자신의 가치관에 충실하게 행동합니다. 창의적이고 독창적인 아이디어로 세상에 변화를 가져오려 합니다.",
  INFP: "강한 내적 신념과 가치를 바탕으로 행동하며, 이상적인 세상을 꿈꾸는 성격입니다. 타인의 감정을 잘 이해하고 공감하며, 자신만의 방식으로 문제를 해결합니다. 독립적이고 창의적인 사고를 중시하며, 내적 평화를 중요하게 생각합니다. 다른 사람들의 성장과 조화를 도모하려고 합니다.",
  ENFP: "열정적이고 창의적이며, 새로운 가능성을 탐구하는 것을 좋아합니다. 자유롭고 유연한 사고방식을 가지고 있으며, 규칙에 얽매이는 것을 싫어합니다. 사람들과의 관계에서 에너지를 얻으며, 타인을 격려하고 동기 부여하는 데 능숙합니다. 다양한 아이디어와 관점을 공유하는 것을 즐깁니다.",
  ENFJ: "따뜻하고 외향적이며, 타인을 돕는 데 강한 의지를 가지고 있습니다. 사교적이고 리더십이 강하며, 조직 내에서 중요한 역할을 맡는 경우가 많습니다. 타인의 성장을 돕는 것을 중요하게 생각하며, 사람들 사이의 조화를 이끌어냅니다. 적극적이고 열정적으로 문제를 해결합니다.",
  INTJ: "분석적이고 독립적이며, 장기적인 계획을 세우는 데 능숙합니다. 체계적이고 논리적인 사고를 중시하며, 복잡한 문제를 해결하는 데 뛰어난 능력을 보입니다. 목표를 달성하기 위해 효율적인 전략을 세우며, 독창적인 아이디어를 바탕으로 미래를 설계합니다. 독립적으로 일하는 것을 선호합니다.",
  INTP: "논리적이고 호기심이 많으며, 새로운 아이디어와 이론을 탐구하는 데 열정적입니다. 복잡한 문제를 해결하거나 새로운 개념을 개발하는 것을 좋아합니다. 독립적으로 일하며, 자신의 생각과 아이디어를 깊이 탐구합니다. 현실보다는 가능성과 이론에 더 중점을 둡니다.",
  ENTP: "독창적이고 재기발랄하며, 새로운 아이디어와 도전을 즐깁니다. 논쟁을 통해 아이디어를 발전시키는 것을 좋아하며, 문제 해결에 창의적인 접근 방식을 선호합니다. 모험심이 강하고 다양한 활동에 참여하며, 주변 사람들에게 활력을 줍니다. 변화와 혁신을 추구하는 성격입니다.",
  ENTJ: "목표 지향적이고 단호하며, 조직을 이끌어가는 데 능숙합니다. 강한 리더십을 바탕으로 효율적인 계획을 세우고 실행합니다. 논리적이고 체계적인 사고를 중시하며, 주어진 자원을 최대한 활용합니다. 어려운 상황에서도 흔들리지 않고, 문제 해결에 집중합니다.",
};

async function genPrompt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    user_nickname,
    user_gender,
    ai_name,
    ai_age,
    ai_job,
    ai_hobby,
    ai_personality,
  } = req.body;
  const ai_gender = user_gender === "남성" ? "여성" : "남성";
  const ai_mbti =
    ai_personality === "string" && ai_personality in mbtiDescriptions
      ? mbtiDescriptions[ai_personality as MBTI]
      : null;
  const prompt_input: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
      【첫 번째 프롬프트: 페르소나 생성기】
      
      당신은 사용자가 입력한 정보를 바탕으로 첫 데이트에서 소개팅 파트너의 페르소나를 생성하는 '페르소나 프롬프트 생성기'입니다.  
      사용자가 입력한 정보는 다음과 같습니다:  
      1) 이름: ${ai_name}  
      2) 성별: ${ai_gender}  
      3) 나이: ${ai_age}  
      4) 직업: ${ai_job}  
      5) 취미: ${ai_hobby}  
      6) MBTI: ${ai_mbti}  
      
      ---
      
      [작업 목표]  
      1. 사용자가 입력한 정보(이름, 성별, 나이, 직업, 취미, MBTI)를 바탕으로, **해당 인물의 직업과 취미가 MBTI 성격 특성에 의해 결정되었음을 서술**한 페르소나를 만든다.  
      2. 페르소나의 **성격**을 10줄 이내로 간결하게 작성하며, MBTI가 인물의 말투·행동·관점 등에 어떤 영향을 미쳤는지 언급한다.  
      3. 너무 장황하게 설명하지 않고, **핵심적인 특징과 가치관을 중심으로** 페르소나를 완성한다.
      
      [페르소나 생성 지침]  
      1. 사용자에게서 제공받은 MBTI를 토대로, **인물의 삶의 방식**(직업·취미 등)에 큰 영향을 미쳤다는 점을 명확히 설명한다.  
      2. **구체적이고 새로운 표현**을 사용하되, 10줄 이내로만 작성한다.  
      3. **불필요한 문구는 최소화**하고, 인물이 어떤 태도로 세상과 사람을 대하는지 명확히 기술한다.
      
      [최종 출력 형태 안내]  
      - **성격** (10줄 이내)
      `,
    },
  ];
  try {
    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: prompt_input,
      temperature: 1.0, // 톤 조절(창의성 정도)
    });
    console.log("프롬프트 생성에 성공했습니다.", response.choices[0].message);
    req.body.ai_personality = response.choices[0].message.content;
    console.log("생성된 프롬프트 성격에 넣기", req.body.ai_personality);
    next();
  } catch (err) {
    res.status(500).json({ message: "프롬프트 생성에 실패했습니다." });
  }
}

async function genProfile(req: Request, res: Response) {
  try {
    const { user_gender, ai_name, ai_age, ai_job, ai_hobby, ai_personality } =
      req.body;
    const ai_gender = user_gender === "남성" ? "여성" : "남성";

    // OpenAI API를 사용하여 이미지 생성
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `저는 ${ai_age}세 ${ai_gender}으로 이름은 ${ai_name}이고 ${ai_job}으로 일하고 있습니다.
      제 취미는 ${ai_hobby}이고, 제 성격은 ${ai_personality}랍니다.
      제가 카페에 앉아서 정면을 바라보고 미소짓는 사진을 생성해주세요.`,
      n: 1,
      size: "1024x1024",
    });

    // 생성된 이미지의 URL 추출
    const imageUrl = response.data[0]?.url;

    if (imageUrl) {
      // 이미지를 클라이언트에 응답
      res.status(200).json({
        success: true,
        imageUrl,
      });
    } else {
      throw new Error("이미지 생성 실패");
    }
  } catch (error) {
    // 에러 처리
    console.error(error);
    res.status(500).json({
      success: false,
      message: "이미지 생성 중 오류가 발생했습니다.",
    });
  }
}

export { genPrompt, genProfile };
