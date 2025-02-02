// HTTP 서버 생성
import http from "http";
import app from "./app";
import { initializeSocketServer } from "./socketServer"; // 소켓 서버 초기화 함수 import
import dotenv from "dotenv";

dotenv.config(); // .env 파일 로드

const PORT: number = Number(process.env.PORT) || 4000;

// HTTP 서버 생성
const server = http.createServer(app);

// HTTP 서버 실행
server.listen(PORT, () => {
  console.log(`Server is running on https://sosweet.site:${PORT}`);

  // 소켓 서버 초기화
  initializeSocketServer(server);
});
