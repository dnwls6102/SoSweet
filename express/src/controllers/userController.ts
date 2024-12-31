import { Request, Response } from 'express';
import User from '../models/User';

// 회원가입
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received body:', req.body);

        // 1. 요청 데이터 받기
        const { user_id, user_password, user_nickname, user_birth, user_job, user_gender, user_level } = req.body;
        
        // 생년월일 유효성 검증 및 처리
        if (!user_birth || !user_birth.year || !user_birth.month || !user_birth.day) {
            res.status(400).json({ message: '유효하지 않은 생년월일 데이터입니다.' });
            return;
        }

        // 생년월일을 Date 객체로 변환
        const formattedBirthdate = new Date(
            `${user_birth.year}-${String(user_birth.month).padStart(2, '0')}-${String(user_birth.day).padStart(2, '0')}`
        );

        // 날짜가 유효한지 확인
        if (isNaN(formattedBirthdate.getTime())) {
            res.status(400).json({ message: '올바르지 않은 생년월일입니다.' });
            return;
        }

        // 2. 유저 데이터 생성
        const newUser = new User({
            user_id,
            user_password,
            user_nickname,
            user_birth: formattedBirthdate,
            user_job,
            user_gender,
            user_level,
            user_state: 0
        });

        // 3. 데이터베이스에 저장
        await newUser.save();

        // 4. 성공 응답 보내기
        res.status(201).json({ message: '회원가입 성공!', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '회원가입 실패. 서버 오류입니다.' })
    }
};

// 회원가입 - 아이디 중복 확인
export const checkUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.body;

        // 아이디 존재하는지 확인
        const existingUser = await User.findOne({ user_id: id });

        if (existingUser) {
            // 이미 사용 중인 아이디
            res.status(200).json({ isExists: true });
        } else {
            // 사용 가능한 아이디
            res.status(200).json({ isExists: false});
        }

    } catch (error) {
        console.error('중복 확인 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다. '})
    }
};
