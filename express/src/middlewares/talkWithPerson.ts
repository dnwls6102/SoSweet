import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import OpenAI from 'openai';

const redisClient = createClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

redisClient.connect().catch((err: Error) => {
  console.error("Redis 연결에 실패했습니다.", err);
});

async function generateGuideMessage(keyword: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "당신은 소개팅 코치입니다. 대화 상대와 함께 특정 활동을 하자고 제안하는 자연스러운 질문을 20자 이내로 생성해주세요."
        },
        {
          role: "user",
          content: `대화 주제가 '${keyword}'인데, 이와 관련해서 함께 하자고 자연스럽게 제안하는 질문을 20자 이내로 만들어주세요.`
        }
      ],
      model: "gpt-4o-mini",
      max_tokens: 50,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || `${keyword} 함께 하러 가실래요?`;
  } catch (error) {
    console.error('GPT 메시지 생성 실패:', error);
    return `${keyword} 함께 하러 가실래요?`;
  }
}

async function recordDialog(req: Request, res: Response): Promise<void> {
  try {
    const { room_id, user_id, script, keywordRef } = req.body;
    
    // 대화 내용 저장
    await redisClient.rPush(`conversations:${room_id}`, JSON.stringify({ role: "user", content: script, name: user_id }));
    
    // 현재 방의 키워드 카운트 가져오기
    const currentKeywords = await redisClient.get(`keywords:${room_id}`);
    let keywordCounts: Record<string, number> = currentKeywords ? JSON.parse(currentKeywords) : {};
    
    // 새로운 키워드 카운트 업데이트
    if (keywordRef && keywordRef.current) {
      Object.entries(keywordRef.current).forEach(([keyword, count]) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + (count as number);
      });
    }
    
    // 업데이트된 키워드 카운트 저장
    await redisClient.set(`keywords:${room_id}`, JSON.stringify(keywordCounts));
    
    let guide_msg = '';
    // 키워드가 5회 이상 언급된 경우 가이드 메시지 생성
    const frequentKeywords = Object.entries(keywordCounts)
      .filter(([_, count]) => count >= 5)
      .map(([keyword]) => keyword);
    
    if (frequentKeywords.length > 0) {
      const randomKeyword = frequentKeywords[Math.floor(Math.random() * frequentKeywords.length)];
      guide_msg = await generateGuideMessage(randomKeyword);
      
      // 키워드 카운트 초기화
      await redisClient.del(`keywords:${room_id}`);
    }
    
    res.status(200).json({ 
      message: "대화 저장 완료",
      guide_msg: guide_msg
    });
  } catch(err) {
    console.error("대화를 기록하는데 실패했습니다.", err);
    res.status(500).json({ message: "대화 저장 중에 문제가 발생했습니다." });
  }
}


async function endChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { room_id } = req.body;

    // Redis에서 대화 기록 가져오기
    const dialog = await redisClient.lRange(`conversations:${room_id}`, 0, -1);
    // Redis에 문자열로 저장되어 있던 json객체를 다시 json 객체로 복원해줘야 한다.
    req.body.script = dialog.map((item: string) => JSON.parse(item));
    console.log(req.body.script);

    // Redis 키 삭제
    await redisClient.del(`conversations:${room_id}`); 
    next();
  } catch(err) {
    console.error("대화를 종료에 실패했습니다.", err);
    res.status(500).json({ message: "대화를 종료하는 중에 문제가 발생했습니다."});
  }
}

// Redis와 연결 끊기
process.on("SIGINT", async () => {
  console.log("Redis 연결 종료...");
  await redisClient.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("서버 종료 중...");
  await redisClient.disconnect();
  process.exit(0);
});



export { recordDialog, endChat };
