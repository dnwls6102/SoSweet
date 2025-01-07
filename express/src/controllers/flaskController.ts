import { Request, Response } from "express";
const fetch = require("node-fetch"); // CommonJS 방식

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:5000";

const roomData: {
    [room_id: string]: {
        [user_id: string]: any;
    };
} = {};  // 빈 객체로 초기화

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

// Flask 서버로 분석 데이터 전달
export const sendFrameInfoToFlask = async (req: Request, res: Response) => {
    try {
        const { frame, timestamp, user_id, room_id } = req.body;

        if (!frame || !timestamp || !user_id || !room_id) {
            return res.status(400).json({ message: "frame, timestamp, user_id, room_id는 필수 입력입니다." });
        }

        const flaskResponse = await fetch(`${FLASK_SERVER_URL}/api/human/frameInfo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ frame, timestamp, user_id, room_id }),
        });

        if (!flaskResponse.ok) {
            throw new Error(`Flask 서버 오류: ${flaskResponse.statusText || "알 수 없는 오류"}`);
        }

        const flaskResult = await flaskResponse.json();
        
        // 상대방 user_id 에 대한 데이터도 오면 취합해서 같이 클라이언트로 보내기
        // roomData에 해당 방의 데이터 저장
        if (!roomData[room_id]) {
            roomData[room_id] = {};
        }
        roomData[room_id][user_id] = flaskResult;

        const usersInRoom = Object.keys(roomData[room_id]);

        // 상대방 정보가 없을 때 기본값 설정
        let user1 = roomData[room_id][user_id];
        const user2Id = usersInRoom.find(id => id !== user_id) || "unknown";

        let user2 = roomData[room_id][user2Id] || {
            user_id: "unknown",
            emo_analysis_result: {
                dominant_emotion: "알 수 없음",
                percentage: 0
            },
            act_analysis: ["상대방 정보 없음"],
        };

        // 응답 데이터 설정
        const usersResponse = {
            room_id: room_id,
            user1: {
                user_id: user1.user_id,
                ...user1,
            },
            user2: {
                user_id: user2.user_id,
                ...user2,
            },
        };

        // 동작 분석 결과 없을 때
        if (!usersResponse.user1.act_analysis.length) {
            usersResponse.user1.act_analysis = ["동작 분석 결과가 없습니다."];
        }
        if (!usersResponse.user2.act_analysis.length) {
            usersResponse.user2.act_analysis = ["동작 분석 결과가 없습니다."];
        }
        
        // 클라이언트에 응답 후 roomData에서 해당 방 데이터 제거
        if (usersInRoom.length === 2) {
            delete roomData[room_id];  // 두 사용자 데이터가 모두 있으면 roomData 삭제
        }

        res.status(200).json({ message: "분석 성공!", data: usersResponse });
    } catch (error) {
        console.error("Flask 분석 요청 오류: ", error);
        res.status(500).json({ message: "Flask 서버 요청 실패", error });
    }
};