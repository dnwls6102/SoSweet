import { Request, Response } from "express";
const fetch = require("node-fetch"); // CommonJS 방식

const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || "http://localhost:5000";


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
        res.status(200).json({ message: "분석 성공!", data: flaskResult });
    } catch (error) {
        console.error("Flask 분석 요청 오류: ", error);
        res.status(500).json({ message: "Flask 서버 요청 실패", error });
    }
};