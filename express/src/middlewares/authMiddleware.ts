import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// 로그인 상태 확인 미들웨어
export const loginRequired = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionId = req.cookies.session_id; // 클라이언트가 보낸 쿠키에서 세션 ID를 가져옴

        if (!sessionId) {
            res.status(401).json({ message: '로그인이 필요합니다.' });
            return;
        }

        // 세션 ID를 이용해 사용자 조회
        const user = await User.findById(sessionId);
        if (!user) {
            res.status(401).json({ message: '유효하지 않은 세션입니다.' });
            return;
        }

        // 요청 객체에 사용자 정보를 추가 (필요한 경우 다른 미들웨어에서 사용 가능)
        req.body.currentUser = user;
        next(); // 다음 미들웨어로 이동
    } catch (error) {
        console.error('인증 오류:', error);
        res.status(500).json({ message: '인증 중 오류가 발생했습니다.' });
    }
};
