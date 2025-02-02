import { Request, Response } from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

// OpenAI API 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TTS 미들웨어
function initTTS(req: Request, res: Response): void {
  try {
    // TTS API 호출 (비동기로 실행)
    openai.audio.speech
      .create({
        model: "tts-1", // 사용할 TTS 모델
        voice: "onyx", // 음성 스타일 (선택 가능)
        input: "Hello World", // 변환할 텍스트
        response_format: "opus",
        speed: 1.15,
      })
      .then((opus) => {
        console.log("TTS 생성 완료:", opus);
        // 필요하면 후속 작업을 여기서 처리
      })
      .catch((error) => {
        console.error("TTS 생성 중 오류 발생:", (error as Error).message);
      });

    // 즉시 응답 반환
    res.send("TTS 요청을 보냈습니다. 생성 작업은 백그라운드에서 진행됩니다.");
  } catch (error) {
    console.error("TTS 요청 중 오류 발생:", (error as Error).message);
    res.status(500).json({ error: "TTS 요청 중 오류가 발생했습니다." });
  }
}

// TTS 미들웨어
async function ttsMiddleware(req: Request, res: Response): Promise<void> {
  const { script, user_gender } = req.body; // 클라이언트에서 텍스트를 전달받음

  try {
    if (!script) {
      res.status(500).send("AI 응답 데이터가 없습니다.");
      return;
    }
    console.log(user_gender);

    const vcModel = user_gender === "남성" ? "nova" : "onyx";

    // TTS API 호출
    const opus = await openai.audio.speech.create({
      model: "tts-1", // 사용할 TTS 모델
      voice: vcModel, // 음성 스타일 (선택 가능)
      input: script, // 변환할 텍스트
      response_format: "opus",
      speed: 1.15,
    });

    // 음성 데이터를 버퍼로 변환
    const buffer: Buffer = Buffer.from(await opus.arrayBuffer());
    console.log("script:", script);
    // 음성 데이터를 HTTP 응답으로 반환
    res.set({
      "Content-Type": "audio/opus",
      "Content-Disposition": 'attachment; filename="output_speech.opus"',
      "X-Script": Buffer.from(script).toString("base64"),
      "Access-Control-Expose-Headers": "X-Script", //서버 환경 전용
    });
    res.send(buffer);
  } catch (error) {
    console.error("TTS 생성 중 오류 발생:", (error as Error).message);
    if (script) {
      res.set({
        "X-Script": Buffer.from(script).toString("base64"),
      });
    }
    res.status(500).json({ error: "TTS 생성 중 오류가 발생했습니다." });
  }
}

export { initTTS, ttsMiddleware };

