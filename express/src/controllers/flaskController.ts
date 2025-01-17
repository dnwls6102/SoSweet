import { Request, Response } from "express";
const fetch = require("node-fetch"); // CommonJS 방식

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL;

const roomData: {
  [room_id: string]: {
    [user_id: string]: any;
  };
} = {}; // 빈 객체로 초기화

// Flask 에서의 return 값
// {
//     "user_id": user_id,
//     "room_id": room_id,
//     "timestamp": timestamp,
//     "emo_analysis_result": {
//         "dominant_emotion": dominant_emotion,
//         "percentage": percentage
//     },
//     "act_analysis": action_messages
// }

// Flask 서버로 분석 데이터 전달 -> 감정/동작 분석 결과 받아오기
export const sendFrameInfoToFlask = async (req: Request, res: Response) => {
  try {
    const { frame, timestamp, user_id, room_id } = req.body;

    if (!frame || !timestamp || !user_id || !room_id) {
      return res.status(400).json({
        message: "frame, timestamp, user_id, room_id는 필수 입력입니다.",
      });
    }

    try {
      const flaskResponse = await fetch(
        `${FLASK_SERVER_URL}/api/human/frameInfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ frame, timestamp, user_id, room_id }),
        }
      );

      if (!flaskResponse.ok) {
        throw new Error(
          `Flask 서버 오류: ${flaskResponse.statusText || "알 수 없는 오류"}`
        );
      }

      const flaskResult = await flaskResponse.json();
      if (!roomData[room_id]) {
        roomData[room_id] = {};
      }
      roomData[room_id][user_id] = flaskResult;
    } catch (error) {
      console.log("Flask 서버 연결 실패, 더미 데이터 사용:", error);
      // Flask 서버 연결 실패 시 더미 데이터 사용
      if (!roomData[room_id]) {
        roomData[room_id] = {};
      }
      roomData[room_id][user_id] = {
        user_id: user_id,
        room_id: room_id,
        timestamp: timestamp,
        emo_analysis_result: {
          dominant_emotion: "평온함",
          percentage: 80
        },
        act_analysis: {
          is_hand: 0,
          is_side: 0,
          is_eye: 0
        }
      };
    }

    // 현재 방에 존재하는 user_id 목록
    const usersInRoom = Object.keys(roomData[room_id]);
    let user1 = roomData[room_id][user_id];
    const user2Id = usersInRoom.find((id) => id !== user_id);

    let user2Data = {
      user_id: user2Id || "unknown",
      emo_analysis_result: {
        dominant_emotion: "평온함",
        percentage: 80,
      },
      act_analysis: {
        is_hand: 0,
        is_side: 0,
        is_eye: 0,
      },
    };

    if (user2Id) {
      user2Data = roomData[room_id][user2Id];
    }

    user1.act_analysis = user1.act_analysis || { is_hand: 0, is_side: 0, is_eye: 0 };
    user2Data.act_analysis = user2Data.act_analysis || { is_hand: 0, is_side: 0, is_eye: 0 };

    res.status(200).json({
      message: "분석 성공!",
      data: {
        room_id,
        user1,
        user2: user2Data,
      },
    });
  } catch (error) {
    console.error("전체 처리 오류: ", error);
    return res.status(500).json({ message: "서버 처리 실패", error });
  }
};
