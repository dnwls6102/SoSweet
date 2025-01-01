import { Server, Socket } from "socket.io";
import http from "http";
import UserSchema, { State } from "./models/User";
import dotenv from "dotenv";
import { global_id, global_gender } from "./app";

dotenv.config();

const PORT = process.env.PORT ?? 3000;
// // DB Connection test
// (async () => {
//   for (let i = 0; i < 5; i++) {
//     await UserSchema.create({
//       user_id: `dummy${i + 1}`,
//       user_gender: "남성",
//       user_state: State.normal,
//     });
//   }
// })();
export const initializeSocketServer = (server: http.Server) => {
  const io = new Server(server, {
    path: "/api/match",
    cors: {
      origin: `http:localhost:${PORT}`,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
    },
  });

  io.on("connection", async (socket: Socket) => {
    // 유저의 반대 성별이면서 매칭 상태인 상대 리스트 출력
    const user_id: string = global_id;
    const user_gender: string = global_gender;
    const matchedGender: string = user_gender == "남성" ? "여성" : "남성";
    let waitingList: any = await UserSchema.find({
      user_id: { $ne: user_id },
      user_gender: matchedGender,
      user_state: State.matching,
    });
    let randomIdx: number =
      waitingList.length !== 0
        ? Math.floor(Math.random() * waitingList.length)
        : -1;
    let isInitiator: boolean = randomIdx === -1 ? true : false;
    // 매칭이 잡혔을 때
    let matchedId: string = "";
    if (randomIdx > -1) {
      matchedId = waitingList[randomIdx].user_id;

      // 해당 방에 참여하고 기본 방 제거
      socket.join(matchedId);
      socket.leave(socket.id);

      // 유저를 소개팅 상태로 변경
      let user = await UserSchema.findOne({ user_id: user_id });
      if (user == null) return; // 유저 정보 없으면 리턴
      user.user_state = State.dating;
      user.save();

      // 방 참가 메세지 전송
      socket.broadcast.emit("joined");
    } else {
      // 유저 id 이름의 소켓 방 생성 및 기본 방 제거
      socket.join(user_id);
      socket.leave(socket.id);

      // 유저를 매칭 상태로 변경
      let user = await UserSchema.findOne({ user_id: user_id });
      if (user == null) return; // 유저 정보 없으면 리턴
      user.user_state = State.matching;
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
          let user = await UserSchema.findOne({ user_id: user_id });
          if (user == null) return; // 유저 정보 없으면 리턴
          user.user_state = State.normal;
          user.save();
        } else {
          socket.leave(matchedId);
          let user = await UserSchema.findOne({ user_id: user_id });
          if (user == null) return; // 유저 정보 없으면 리턴
          user.user_state = State.normal;
          user.save();
        }
      }

      console.log(isInitiator, message);
      if (isInitiator && message === "change state") {
        console.log("ㅎㅇ");
        let user = await UserSchema.findOne({ user_id: user_id });
        if (user == null) return; // 유저 정보 없으면 리턴
        user.user_state = State.dating;
        user.save();
      }

      if (isInitiator) {
        // console.log(io.sockets.adapter.rooms.get(user_id));
        // console.log("Host Message : ", message);
        socket.to(user_id).emit("message", message);
      } else {
        // console.log("Guest Message : ", message);
        socket.to(matchedId).emit("message", message);
      }
    });
  });
};
