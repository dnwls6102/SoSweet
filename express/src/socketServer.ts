import { Server, Socket } from "socket.io";
import http from "http";
import UserSchema, { State } from "./models/User";
import dotenv from "dotenv";
import { global_id, global_gender } from "./app";

// WebRTC 관련 타입 정의
interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

interface RTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

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
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["*"]
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 연결 디버깅을 위한 이벤트 리스너
  io.engine.on("connection_error", (err) => {
    console.log("Connection Error:", err.req);      // request object
    console.log("Error message:", err.code);        // error code
    console.log("Error message:", err.message);     // error message
    console.log("Error context:", err.context);     // additional error context
  });

  // 대기 중인 사용자 관리를 위한 Map
  const waitingUsers = new Map();
  // 활성화된 방 관리를 위한 Map
  const activeRooms = new Map();

  io.on("connection", async (socket: Socket) => {
    console.log("새로운 사용자 연결:", socket.id);

    // 매칭 시작 이벤트 처리
    socket.on("startMatching", async (userData) => {
      const { id, gender } = userData;
      console.log("매칭 시작:", id, gender);
      
      // 대기열에 사용자 추가
      waitingUsers.set(socket.id, { id, gender, socket });
      
      // 매칭 시도
      tryMatch(socket, gender);
    });

    // 매칭 시도 함수
    async function tryMatch(currentSocket: Socket, currentGender: string) {
      const oppositeGender = currentGender === "남성" ? "여성" : "남성";
      
      // 대기 중인 상대 찾기
      for (const [waitingSocketId, waitingUser] of waitingUsers) {
        if (waitingUser.gender === oppositeGender) {
          // 매칭 성공
          const room = `room_${Date.now()}`;
          currentSocket.join(room);
          waitingUser.socket.join(room);
          
          // 방 정보 저장
          activeRooms.set(room, {
            users: [waitingSocketId, currentSocket.id]
          });
          
          // 양쪽 모두에게 매칭 성공 알림
          io.to(room).emit("matchSuccess", { room });
          
          // 대기열에서 제거
          waitingUsers.delete(waitingSocketId);
          waitingUsers.delete(currentSocket.id);
          
          // DB 상태 업데이트
          await updateUserState(waitingUser.id, State.dating);
          await updateUserState(currentSocket.id, State.dating);
          
          return;
        }
      }
    }

    // WebRTC 시그널링 이벤트 처리
    socket.on("join", async (data: { room: string }) => {
      console.log("User joined room:", data.room);
      socket.join(data.room);
      
      // 방에 있는 다른 사용자 수 확인
      const clients = await io.in(data.room).allSockets();
      if (clients.size === 2) {
        // 두 번째 사용자가 들어왔을 때 시그널링 시작
        socket.emit("ready");
      }
    });

    socket.on("offer", (data: { offer: RTCSessionDescription; room: string }) => {
      console.log("Offer received:", data.room);
      socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", (data: { answer: RTCSessionDescription; room: string }) => {
      console.log("Answer received:", data.room);
      socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("candidate", (data: { candidate: RTCIceCandidate; room: string }) => {
      console.log("ICE candidate received:", data.room);
      socket.to(data.room).emit("candidate", data.candidate);
    });

    // 연결 종료 처리
    socket.on("disconnect", () => {
      // 대기열에서 제거
      waitingUsers.delete(socket.id);
      
      // 활성화된 방에서 제거
      for (const [room, data] of activeRooms) {
        if (data.users.includes(socket.id)) {
          // 상대방에게 연결 종료 알림
          socket.to(room).emit("peerDisconnected");
          activeRooms.delete(room);
          break;
        }
      }
    });
  });
};

// DB 상태 업데이트 함수
async function updateUserState(userId: string, state: State) {
  try {
    const user = await UserSchema.findOne({ user_id: userId });
    if (user) {
      user.user_state = state;
      await user.save();
    }
  } catch (error) {
    console.error("상태 업데이트 실패:", error);
  }
}