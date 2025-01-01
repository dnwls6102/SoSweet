import { Request, Response, NextFunction } from 'express';
import { OpenAI } from 'openai';
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

console.log(process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string; // 'name' 속성이 필요한 경우 추가
};


// 대화 기록 변수 (유저별 대화 기록 저장 가능하도록 확장 가능)
let conversation: ChatCompletionMessageParam[] | null = null;

// 미들웨어로 분리된 챗봇 로직
// req.body.text를 받아 LLM으로 전송
// LLM 응답을 req.responseText에 저장 후 next()로 전달
async function chatMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userText: string = req.body.script;

  // text가 입력되지 않았을 경우에 오류 처리
  if (!userText) {
    res.status(400).send("No text provided.");
    return;
  }

  try {
    if (!conversation) {
      conversation = [{
        role: "system",
        content: `내가 작성한 프롬프트`
      }];
    }

    // 대화 기록에 입력받은 유저 메세지 추가
    conversation.push({
      role: "user",
      content: userText,
    });

    // ChatCompletion API 호출 == LLM에 유저 메세지 전달
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 혹은 'gpt-4' 등 다른 모델로 변경 가능
      messages: conversation,
      temperature: 1.0, // 톤 조절(창의성 정도)
      // max_tokens, top_p, frequency_penalty 등 추가 옵션 설정 가능
    });

    console.log(conversation);

    // AI 응답 받기
    const assistantAnswer: string | null = response.choices[0].message.content;
    if (assistantAnswer === null) {
      throw new Error("Assistant answer is null.");
    }
    
    // 대화 기록에 AI 대답 저장
    conversation.push({
      role: "assistant",
      content: assistantAnswer,
    });


    // TTS 처리를 위해서 AI 답변 req에 저장
    req.responseText = assistantAnswer.replace(/【.*?】/g, "");

    // 다음 미들웨어로 넘어가기
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate response from OpenAI.");
  }
};

function endChat(req: Request, res: Response): Response {
  conversation = null;
  return res.status(200).json({ message: "대화를 종료했습니다. 새로운 대화를 시작하려면 메시지를 다시 보내세요." });
}

export { chatMiddleware, endChat };
