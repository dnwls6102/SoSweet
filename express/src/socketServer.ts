import { Server, Socket } from "socket.io";
import http from "http";
import dotenv from "dotenv";

// WebRTC 관련 타입 정의
interface RTCSessionDescription {
  type: "offer" | "answer";
  sdp: string;
}

interface RTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

dotenv.config();

// 평가를 담기 위한 객체 생성
const evaluations: {
  [room_id: string]: {
    [user_id: string]: {
      rating: number;
      like: boolean;
      comment: string;
    };
  };
} = {};

let io: Server;

export function initializeSocketServer(server: http.Server) {
  io = new Server(server, {
    path: "/api/match",
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
    },
  });

  // 대기 중인 사용자 관리를 위한 Map
  const waitingUsers = new Map();

  io.on("connection", async (socket: Socket) => {
    console.log("새로운 사용자 연결:", socket.id);

    // 매칭 시작 이벤트 처리
    socket.on("startMatching", async (userData) => {
      const { user_id, gender } = userData;
      console.log("매칭 시작:", user_id, gender);

      // 대기열에 사용자 추가
      waitingUsers.set(socket.id, { user_id, gender, socket });

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
          const room_id = `room_${Date.now()}`;
          currentSocket.join(room_id);
          waitingUser.socket.join(room_id);

          // 양쪽 모두에게 매칭 성공 알림
          io.to(room_id).emit("matchSuccess", { room_id });

          // 대기열에서 제거
          waitingUsers.delete(waitingSocketId);
          waitingUsers.delete(currentSocket.id);

          return;
        }
      }
    }

    // WebRTC 시그널링 이벤트 처리
    socket.on("join", async (data: { room_id: string }) => {
      console.log("User joined room:", data.room_id);

      // 방에 있는 다른 사용자 수 확인
      const clients = await io.in(data.room_id).allSockets();
      if (clients.size === 2) {
        // 두 번째 사용자가 들어왔을 때 시그널링 시작
        socket.emit("ready");
      }
    });

    socket.on(
      "offer",
      (data: { offer: RTCSessionDescription; room_id: string }) => {
        console.log("Offer received:", data.room_id);
        socket.to(data.room_id).emit("offer", data.offer);
      }
    );

    socket.on(
      "answer",
      (data: { answer: RTCSessionDescription; room_id: string }) => {
        console.log("Answer received:", data.room_id);
        socket.to(data.room_id).emit("answer", data.answer);
      }
    );

    socket.on(
      "candidate",
      (data: { candidate: RTCIceCandidate; room_id: string }) => {
        console.log("ICE candidate received:", data.room_id);
        socket.to(data.room_id).emit("candidate", data.candidate);
      }
    );
    // 상대방에게 평가 보내고, 평가 받기. 양쪽 다 평가를 완료하면 소켓을 닫고 피드백 페이지로 이동하기.
    socket.on(
      "submitFeedback",
      (data: {
        comment: string;
        rating: number;
        like: boolean;
        room_id: string;
        user_id: string;
      }) => {
        const { comment, rating, like, room_id, user_id } = data;
        console.log("피드백 데이터 수신:", {
          room_id,
          user_id,
          rating,
          like,
          comment,
        });

        if (!evaluations[room_id]) {
          evaluations[room_id] = {};
        }

        evaluations[room_id][user_id] = { rating, comment, like };
        console.log(`${user_id}로부터의 피드백이 도착했습니다.`);
        console.log("현재 방의 평가 데이터:", evaluations[room_id]);

        // 피드백을 작성한 유저 수 확인
        const room_users = Object.keys(evaluations[room_id]);
        const userCount = room_users.length;
        console.log("현재 피드백 수:", userCount, "방:", room_id);

        if (userCount === 2) {
          console.log(
            "두 명의 피드백이 모두 도착했습니다. receiveFeedback 이벤트 전송"
          );

          // 방의 모든 소켓에 전체 평가 데이터 전송
          // 객체를 깊은 복사하여 전송
          const feedbackData = JSON.parse(JSON.stringify(evaluations[room_id]));
          io.to(room_id).emit("receiveFeedback", feedbackData);
          console.log("전체 피드백 데이터 전송 완료:", feedbackData);

          // 피드백 삭제
          delete evaluations[room_id];
          console.log("피드백 데이터 삭제 완료");
        }
      }
    );

    socket.on("endCall", (data: { room_id: string }) => {
      console.log("endCall 이벤트 수신:", data.room_id);

      socket.to(data.room_id).emit("peerDisconnected");
      console.log("상대방에게 연결 종료 알림 전송:", data.room_id);
    });

    // 연결 종료 처리
    socket.on("disconnect", () => {
      // 대기열에서 제거
      waitingUsers.delete(socket.id);
      console.log("연결 종료: ", socket.id);
    });

    // 뒤로가기 이벤트 발생 시 대기 리스트 제거 및 소켓 해제
    socket.on("match-disconnect", () => {
      waitingUsers.delete(socket.id);
      socket.disconnect();
    });
    console.log(waitingUsers);
  });
}

// 다른 모듈에서 소켓 인스턴스를 사용할 수 있도록 export
export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
}
