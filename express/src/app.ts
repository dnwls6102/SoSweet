import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/userRoutes";
import apiRoutes from "./routes/apiRoutes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config(); // .env 파일 로드

const app = express();
// 쿠키 파싱 미들웨어: 최상단에 위치해야 한다고 함
app.use(cookieParser());
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
// 쿠키 뜯어볼 수 있게 쿠키 파서 설정
app.use(cookieParser());

// CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.options('*', cors()); // CORS 사전 요청 허용

app.use(express.json({ limit: '50mb' }));  // JSON 요청 크기 제한 증가
app.use(express.urlencoded({ limit: '50mb', extended: true }));  // form-urlencoded 데이터 크기 제한

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/sosweet", {})
  .then(() => console.log("MongoDB 연결 성공!"))
  .catch((error: unknown) => console.error("MongoDB 연결 실패: ", error));

// Socket에서 사용할 전역 변수
export let global_id: string = "";
export let global_gender: string = "";
// REST API 라우트 등록
// 임시 라우트
app.get("/chat", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});
// user 라우트
app.use("/users", userRoutes);

// api , flask 서버 라우트
app.use("/api", apiRoutes);


app.post("/api/match", (req: Request, res: Response) => {
  global_id = req.body.id;
  global_gender = req.body.gender;
  res.send("응답");
});
// // 기본 경로
// app.get("/", (req: Request, res: Response) => {
//   res.send("SoSweet 서버가 실행 중입니다");
// });

export default app;