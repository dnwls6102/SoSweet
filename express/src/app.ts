import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User';
import userRoutes from './routes/userRoutes';

dotenv.config(); // .env 파일 로드

const app = express();

// JSON 파싱 미들웨어
app.use(express.json());

// CORS 설정
app.use(cors({
    origin: process.env.CLIENT_URL, // 허용할 클라이언트 도메인
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드
    credentials: true // 쿠키 허용
}));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sosweet', {
})
  .then(() => console.log('MongoDB 연결 성공!'))
  .catch((error: unknown) => console.error('MongoDB 연결 실패: ', error))


// REST API 라우트 등록
app.use('/users', userRoutes);


// 기본 경로
app.get('/', (req: Request, res: Response) => {
  res.send('SoSweet 서버가 실행 중입니다');
});

export default app;



