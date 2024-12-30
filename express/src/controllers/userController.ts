import { Request, Response } from 'express';
import User from '../models/User';

// 회원가입
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. 요청 데이터 받기
        const { user_id, user_password, user_nickname, user_birth, user_job, user_gender, user_level } = req.body;
        
        // user_birth가 전달되지 않았거나 필드가 없는 경우 기본값 설정
        // const birthDate = user_birth
        // ? new Date(
        //     `${user_birth.year || '1900'}-${(user_birth.month || '01').padStart(2, '0')}-${(user_birth.day || '01').padStart(2, '0')}`
        //   )
        // : null;
    
        // if (!birthDate) {
        //     res.status(400).json({ message: '유효하지 않은 생년월일 데이터입니다.' });
        //     return;
        // }
    

        // 2. 유저 데이터 생성
        const newUser = new User({
            user_id,
            user_password,
            user_nickname,
            user_birth: new Date(user_birth),
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
