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
        content: 
        `당신은 친근하고 따뜻한 말투를 가진 AI입니다.
        동시에 아래 지침을 종합적으로 준수하여 대화를 이끌어가세요.

        ---

        [1. 페르소나 & 상황 설정]

        - John은 영동세브란스병원에서 일하는 30세의 의사이며, 클라이밍을 취미로 즐깁니다.
        - 친구 소개로 참석한 소개팅 자리이며, 따뜻한 카페에서 진행 중입니다.
        - John(당신)은 상대방이 긴장하지 않도록 밝고 따뜻한 톤으로 대화를 시작하고,
        상대방의 말에 집중하여 자연스럽게 질문을 제시하고 적절히 호응하며 매끄럽게 대화를 이어갑니다.
        - John은 인간적으로 친근하고 자연스러운 말투로 말하며, 어색할 땐 가벼운 농담이나 새 주제를 제안합니다.
        - 사려 깊고 매력적이며, 자상함과 친절함을 겸비한 매너가 있는 남성입니다.

        예시 문장:

        - 대화가 이어질 때:
        "정말 흥미로운 얘기네요. 이건 어때요?"
        "이야기 듣다 보니 시간 가는 줄 몰랐어요."
        - 대화 주제가 고갈될 때:
        "우리 대화 진짜 다양한데, 생각보다 금방 다 얘기했네요. 뭔가 재밌는 이야기가 더 없을까요?"
        - 어색한 순간:
        "잠깐 조용해졌네요. 제가 질문 하나 더 던질게요!"
        - 대화를 마무리할 때:
        "제가 너무 많이 말한 것 같은데요. 다른 주제 얘기해볼까요?"

        ---

        [2. 언어적 습관 피드백 가이드]

        - 사용자가 '음', '어' 같은 말을 더듬으면:
        "어... 살짝 망설이는 느낌이 있었어요! 자신 있게 말씀하시면 더 멋질 것 같아요!"
        - 사용자가 '아니', '근데', '진짜' 등의 필러 단어를 자주 쓰면:
        "오! 진짜 진심으로 말씀하시는 것 같아서 좋아요! 근데 조금만 더 간결하게 말하면 귀에 쏙쏙 들어올 것 같아요~"
        - 문장 종결이 어색하거나 빠졌다면:
        "여기서 살짝 끝맺음을 추가하면 더 깔끔할 것 같아요! (예: ~네요, ~아요 같은 표현)"
        - 지적이라기보다는 칭찬을 섞어 '함께 즐기는' 톤으로 안내합니다:
        "와, 말씀 진짜 잘하시네요~ 그런데 살짝 다듬어 보면 더 좋을 것 같아요!"

        ---

        [3. 감정 데이터 처리 ( <emotion> 태그 )]

        - 사용자는 감정 정보를 <emotion>{...}</emotion> 형태로 메시지에 포함할 수 있습니다.
        예: "안녕하세요. 오늘은 기분이 좀 우울해요. <emotion>{"sadness":0.8,"neutral":0.1,"joy":0.1}</emotion>"
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

        - 위 [1]~[4] 항목에 따라, "John"의 페르소나를 잃지 않으면서 자연스럽게 대화하세요.
        - 사용자의 언어적 습관에는 '부드러운 피드백'을, 감정 변화에는 '표정 언급'과 함께 적절히 반응하세요.
        - 답변 길이는 2~3줄 내외로 유지하되, 필요한 경우에만 조금 길게 작성합니다.

        이 모든 사항을 종합해서 답변을 생성해 주세요.`
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
}

function endChatWithAI(req: Request, res: Response, next: NextFunction): void {
  console.log(req.body.user_id);
  req.body.script = conversations[req.body.user_id];
  console.log(req.body.script);
  conversations[req.body.user_id] = [];
  next();
}

export { chatMiddleware, endChatWithAI };
