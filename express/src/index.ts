const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server, Socket } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const cors = require("cors");

// TS 타입 임포트
import { Request, Response } from "express";

dotenv.config(); // .env 파일 로드

// CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL, // 허용할 클라이언트 도메인
    methods: ["GET", "POST", "PUT", "DELETE"], // 허용할 HTTP 메서드
    credentials: true, // 쿠키 허용
  })
);

// JSON 파싱 미들웨어
app.use(express.json());
// URL 쿼리 파싱 미들웨어
app.use(express.urlencoded({ extended: true }));

// 정적 파일 사용
app.use(express.static(path.join(__dirname, "public")));
// "/node_modules" 경로로 요청이 들어오면 node_modules 정적 파일의 모듈 제공
app.use(
  "/node_modules",
  express.static(path.join(__dirname, "..", "node_modules"))
);

const PORT: number = Number(process.env.PORT) || 3000; // .env 에서 PORT 가져오기, 기본값 3000

// // 간단한 라우터 추가
// app.get("/", (req: Request, res: Response) => {
//   res.send("소스윗 백엔드 서버 실행 중입니당");
// });

// Socket 서버 생성
const io = new Server(server);

// client와 socket 연결 시 동작
io.on("connection", (socket: typeof Socket) => {
  // 접속한 Client 식별
  console.log(`Client ID : ${socket.id} connected.`);
  let randomRoomName = "foo";
  // console.log('!============================================');
  // console.log(socket.rooms);
  // console.log(io.sockets.adapter.rooms);
  // console.log(io.sockets.adapter.rooms.get(randomRoomName));
  // console.log('!============================================');
  socket.on("message", (message: string) => {
    // message가 bye면 채팅방(foo)을 비우는(leave) 코드
    let elements = io.sockets.adapter.rooms.get(randomRoomName);
    if (message === "bye" && elements) {
      elements.forEach((socketId: string) => {
        let clientSocket = io.sockets.sockets.get(socketId);
        if (clientSocket) {
          clientSocket.leave(randomRoomName);
        }
      });
    }

    // 수신한 메세지를 현재 소켓을 제외한 모든 클라이언트에 전송
    socket.broadcast.emit("message", message);
  });

  // foo라는 방에 들어가고 기존 기본 방 떠나기
  // console.log('==========================');
  // socket.join('foo');
  // socket.leave(socket.id);
  // io.sockets.adapter.rooms.forEach(console.log);
  // console.log('==========================');

  socket.on("create or join", () => {
    // let randomRoomName = 'foo';
    console.log(`Received request to create or join room : ${randomRoomName}`);

    // Map으로 된 방 중에서 랜덤 방 이름 키의 요소 가져오기
    let clientsInRoom = io.sockets.adapter.rooms.get(randomRoomName);
    // Set으로 된 클라이언트 목록의 크기 가져오기
    let numClients = clientsInRoom ? clientsInRoom.size : 0;

    console.log(`Room ${randomRoomName} now has ${numClients} client(s)`);

    // 방의 인원이 없다면
    if (numClients === 0) {
      socket.join(randomRoomName);
      // log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit("created", randomRoomName, socket.id);
    } else if (numClients === 1) {
      // 방에 인원이 있다면
      // 현재 소켓을 포함한 해당 방 안의 모든 소켓에 메세지 전송
      // 그러나 입장하는 클라이언트는 아직 방에 들어가지 않았으므로,
      // 생성 클라이언트에게만 메세지가 전송된다
      io.sockets.in(randomRoomName).emit("join", randomRoomName);
      socket.join(randomRoomName);
      // socket.emit('joined', randomRoomName, socket.id);
      socket.emit("joined", randomRoomName);
      io.sockets.in(randomRoomName).emit("ready");
    } else {
      // 인원이 2명으로 가득 찼다면
      socket.emit("full", randomRoomName);
    }
  });

  socket.on("bye", () => {
    console.log("received bye");
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
