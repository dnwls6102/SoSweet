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

// 평가를 담기 위한 객체 생성
const evaluations: {
  [room_id:string]: {
    [user_id: string]: {
      rating: number;
      like: boolean;
      comment: string;
    }
  } 
} = {}; 

export const initializeSocketServer = (server: http.Server) => {
  const io = new Server(server, {
    path: "/api/match",
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
    },
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
      console.log(`매칭 시도: ${currentSocket.id}(${currentGender}) -> ${oppositeGender} 찾는 중`);
      
      // 대기 중인 상대 찾기
      for (const [waitingSocketId, waitingUser] of waitingUsers) {
        if (waitingUser.gender === oppositeGender) {
          // 매칭 성공
          const room = `room_${Date.now()}`;
          console.log(`매칭 성공: ${currentSocket.id}(${currentGender}) <-> ${waitingSocketId}(${oppositeGender})`);
          console.log(`방 생성: ${room}`);
          
          currentSocket.join(room);
          waitingUser.socket.join(room);
          
          // 방 정보 저장
          activeRooms.set(room, {
            users: [waitingSocketId, currentSocket.id]
          });
          
          // 양쪽 모두에게 매칭 성공 알림
          io.to(room).emit("matchSuccess", { room });
          console.log(`매칭 성공 이벤트 전송 완료: ${room}`);
          
          // 대기열에서 제거
          waitingUsers.delete(waitingSocketId);
          waitingUsers.delete(currentSocket.id);
          
          // DB 상태 업데이트
          await updateUserState(waitingUser.id, State.dating);
          await updateUserState(currentSocket.id, State.dating);
          
          return;
        }
      }
      console.log(`매칭 실패: ${oppositeGender} 대기자 없음`);
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

    socket.on("offer", (data: { offer: RTCSessionDescription, room: string }) => {
      console.log("Offer received:", data.room);
      socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", (data: { answer: RTCSessionDescription, room: string }) => {
      console.log("Answer received:", data.room);
      socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("candidate", (data: { candidate: RTCIceCandidate, room: string }) => {
      console.log("ICE candidate received:", data.room);
      socket.to(data.room).emit("candidate", data.candidate);
    });
    // 상대방에게 평가 보내고, 평가 받기. 양쪽 다 평가를 완료하면 소켓을 닫고 피드백 페이지로 이동하기.
    socket.on("submitFeedback", (data: { comment: string, rating: number, like: boolean, room: string, user_id: string }) => {
      const { comment, rating, like, room, user_id } = data;
      console.log("피드백 데이터 수신:", { room, user_id, rating, like, comment });

      if (!evaluations[room]) {
        evaluations[room] = {};
      }

      evaluations[room][user_id] = { rating, comment, like };
      console.log(`${user_id}로부터의 피드백이 도착했습니다.`);
      console.log("현재 방의 평가 데이터:", evaluations[room]);
      
      // 피드백을 작성한 유저 수 확인
      const room_users = Object.keys(evaluations[room]);
      const userCount = room_users.length;
      console.log("현재 피드백 수:", userCount, "방:", room);
      
      if (userCount === 2) {
        console.log("두 명의 피드백이 모두 도착했습니다. receiveFeedback 이벤트 전송");
        
        // 방의 모든 소켓에 전체 평가 데이터 전송
        // 객체를 깊은 복사하여 전송
        const feedbackData = JSON.parse(JSON.stringify(evaluations[room]));
        io.to(room).emit("receiveFeedback", feedbackData);
        console.log("전체 피드백 데이터 전송 완료:", feedbackData);
        
        // 피드백 삭제
        delete evaluations[room];
        console.log("피드백 데이터 삭제 완료");
      }
    })

    socket.on("endCall", (data: { room: string}) => {
      console.log("endCall 이벤트 수신:", data.room);
      
      // room 정보를 직접 사용
      const roomData = activeRooms.get(data.room);
      if (roomData) {
        // 상대방에게 연결 종료 알림
        socket.to(data.room).emit("peerDisconnected");
        console.log("상대방에게 연결 종료 알림 전송:", data.room);
        activeRooms.delete(data.room);
      } else {
        console.log("해당 room을 찾을 수 없음:", data.room);
      }
    })

    // 연결 종료 처리
    socket.on("disconnect", () => {
      // 대기열에서 제거
      console.log("연결 종료: ", socket.id);
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