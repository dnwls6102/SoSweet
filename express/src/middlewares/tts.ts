import { Request, Response } from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

// OpenAI API 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// TTS 미들웨어
async function initTTS(req: Request, res: Response): Promise<void> {
  try {
    // TTS API 호출
    const opus = await openai.audio.speech.create({
      model: "tts-1", // 사용할 TTS 모델
      voice: "onyx", // 음성 스타일 (선택 가능)
      input: "Hello World", // 변환할 텍스트
      response_format: "opus",
      speed: 1.15,
    });

    res.send("tts를 초기화했습니다.");
  } catch (error) {
    console.error("TTS 생성 중 오류 발생:", (error as Error).message);
    res.status(500).json({ error: "TTS 생성 중 오류가 발생했습니다." });
  }
}

// TTS 미들웨어
async function ttsMiddleware(req: Request, res: Response): Promise<void> {
  try {
    const { script, user_gender } = req.body; // 클라이언트에서 텍스트를 전달받음
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

    // 음성 데이터를 HTTP 응답으로 반환
    res.set({
      "Content-Type": "audio/opus",
      "Content-Disposition": 'attachment; filename="output_speech.opus"',
      "X-script": script,
    });
    res.send(buffer);
  } catch (error) {
    console.error("TTS 생성 중 오류 발생:", (error as Error).message);
    res.status(500).json({ error: "TTS 생성 중 오류가 발생했습니다." });
  }
}

export { initTTS, ttsMiddleware };
