import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const app = express();

// CORS 설정
app.use(cors({
    origin: process.env.CLIENT_URL, // 허용할 클라이언트 도메인
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드
    credentials: true // 쿠키 허용
}));

// JSON 파싱 미들웨어
app.use(express.json());

// 간단한 라우터 추가
app.get('/', (req: Request, res: Response) => {
  res.send('소스윗 백엔드 서버 실행 중입니당');
});

export default app;
