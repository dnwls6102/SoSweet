import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import path from "path";
import { chatMiddleware } from "./middlewares/talkWithAI";
import { ttsMiddleware } from "./middlewares/tts";
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

const app = express();

// JSON 파싱 미들웨어
app.use(express.json());
// URL 쿼리 파싱 미들웨어
app.use(express.urlencoded({ extended: true }));

// 정적 파일 사용
app.use(express.static(path.join(__dirname, "public")));
// "/node_modules" 경로의 요청 시 node_modules 정적 파일 모듈 제공
app.use(
  "/node_modules",
  express.static(path.join(__dirname, "..", "node_modules"))
);

// CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL, // 허용할 클라이언트 도메인
    methods: ["GET", "POST", "PUT", "DELETE"], // 허용할 HTTP 메서드
    credentials: true, // 쿠키 허용
  })
);

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// // MongoDB 연결
// mongoose
//   .connect(process.env.MONGO_URI || "mongodb://localhost:27017/sosweet", {})
//   .then(() => console.log("MongoDB 연결 성공!"))
//   .catch((error: unknown) => console.error("MongoDB 연결 실패: ", error));

// Socket에서 사용할 전역 변수
export let global_id: string = "";
export let global_gender: string = "";
// REST API 라우트 등록
// 임시 라우트
app.get("/chat", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});
app.use("/users", userRoutes);
app.post("/api/match", (req: Request, res: Response) => {
  global_id = req.body.id;
  global_gender = req.body.gender;
  res.send("응답");
});

// // 기본 경로
// app.get("/", (req: Request, res: Response) => {
//   res.send("SoSweet 서버가 실행 중입니다");
// });

app.post("/api/ai/dialog", chatMiddleware, ttsMiddleware);

export default app;



