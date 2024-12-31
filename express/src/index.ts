const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server, Socket } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const cors = require("cors");

const dbConnect = require("./config/dbConnect");
dbConnect(); // DB 접속

const User = require("./models/userModel");

// TS 타입 임포트
import { Request, Response } from "express";

dotenv.config(); // .env 파일 로드

const PORT: number = Number(process.env.PORT) || 3000; // .env 에서 PORT 가져오기, 기본값 3000

// CORS 설정
app.use(
  cors({
    // origin: process.env.CLIENT_URL, // 허용할 클라이언트 도메인
    origin: [`https://localhost:${PORT}`, "https://localhost"], // 허용할 클라이언트 도메인
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

// Socket 서버 생성
// '/api/match' 경로일 때만 요청 가능
const io = new Server(server
  , {
  path: "/api/match",
  cors: {
    origin: [`https://localhost:${PORT}`, "https://localhost"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  },
}
);
// // DB Connection test
// (async()=> {
//   for (let i = 0; i < 10; i++) {
//     await User.create({id: `dummy${i+1}`, gender: 1, state: 0})
//   }
// })();
let id: any;
let gender: any;
enum Gender {
  male = 1,
  female,
}
enum State {
  normal,
  matching,
  dating,
}
app.get("/chat", async (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'))
});
app.get('/api/match', (req: Request, res: Response)=>{
  id = req.query.id;
  gender = Number(req.query.gender);
  res.json({message:'매칭을 시작합니다.'});
});
io.on("connection", async (socket: typeof Socket) => {
  // 유저의 반대 성별이면서 매칭 상태인 상대 리스트 출력
  const user_id = id;
  const user_gender = gender;
  const matchedGender: Gender =
  Number(user_gender) == Gender.male ? Gender.female : Gender.male;
  let waitingList: any = await User.find({
    id: { $ne: user_id },
    gender: matchedGender,
    state: State.matching,
  });
  let randomIdx: number = waitingList.length !== 0 ? Math.floor((Math.random() * waitingList.length)) : -1;
  let isInitiator: boolean = randomIdx === -1 ? true : false;

  // 매칭이 잡혔을 때
  let matchedId: string = '';
  if (randomIdx > -1) {
    matchedId = waitingList[randomIdx].id;
    
    // 해당 방에 참여하고 기본 방 제거
    socket.join(matchedId);
    socket.leave(socket.id);
    
    // 유저를 소개팅 상태로 변경
    let user = await User.findOne({ id: user_id });
    user.state = State.dating;
    user.save();
    
    // 방 참가 메세지 전송
    socket.broadcast.emit("joined");
  } else {
    // 유저 id 이름의 소켓 방 생성 및 기본 방 제거
    socket.join(user_id);
    socket.leave(socket.id);
    
    // 유저를 매칭 상태로 변경
    let user = await User.findOne({ id: user_id });
    user.state = State.matching;
    user.save();
    
    // 방 생성 메세지 전송
    socket.emit("created");
  }
  
  // console.log('isInitiator in server', isInitiator);

  // 메세지 받으면, 해당 방의 다른 클라이언트에게 메세지 전송
  socket.on("message", async (message: any) => {
    // socket.to(matchedId).emit("message", message);
    if (message === "bye") {
      if (isInitiator) {
        socket.leave(user_id);
        let user = await User.findOne({ id: user_id });
        user.state = State.normal;
        user.save();
      } else {
        socket.leave(matchedId);
        let user = await User.findOne({ id: user_id });
        user.state = State.normal;
        user.save();
      }
    }

    if (isInitiator && message === 'change state') {
      let user = await User.findOne({ id: user_id });
      user.state = State.dating;
      user.save();
    }

    if (isInitiator) {
      console.log('Host Message : ', message);
      socket.to(user_id).emit('message', message);
    } else {
      console.log('Guest Message : ', message);
      socket.to(matchedId).emit("message", message);
    }
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
