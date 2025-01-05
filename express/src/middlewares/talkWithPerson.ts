import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const redisClient = createClient();

redisClient.connect().catch((err) => {
  console.error("Redis 연결에 실패했습니다.", err);
});

// // Redis 오류 발생 시 처리: 재연결 시도
// redisClient.on("error", (err) => {
//   console.error("Redis 오류 발생:", err);
//   setTimeout(() => {
//     redisClient.connect().catch((err) => {
//       console.error("Redis 재연결 시도 실패:", err);
//     });
//   }, 5000);
// });

async function recordDialog(req: Request, res: Response): Promise<void> {
  try {
    const { room_id,user_id, script} = req.body;
    // 아쉽게도 Redis는 문자열 기반 저장소이기 때문에, 키와 밸류 모두 문자열로 저장해야 한다.
    await redisClient.rPush(`conversations:${room_id}`, JSON.stringify({ role: "user", content: script, name:user_id}));
    const record = await redisClient.lRange(`conversations:${room_id}`, 0, -1);
    console.log(record);
  
    res.status(200).json({ message: "대화 저장 완료"})
  } catch(err) {
    console.error("대화를 기록하는데 실패했습니다.", err);
    res.status(500).json({ message: "대화 저장 중에 문제가 발생했습니다."});
  }
}


async function endChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { room_id } = req.body;

    // Redis에서 대화 기록 가져오기
    const dialog = await redisClient.lRange(`conversations:${room_id}`, 0, -1);
    // Redis에 문자열로 저장되어 있던 json객체를 다시 json 객체로 복원해줘야 한다.
    req.body.script = dialog.map((item) => JSON.parse(item));
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