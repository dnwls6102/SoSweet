import { Router } from 'express';
import { loginUser, registerUser, checkUserId, logoutUser } from '../controllers/userController';
import { loginRequired } from '../middlewares/authMiddleware';

const router = Router();

// 회원가입
router.post('/', registerUser);

// 회원가입 - 중복 아이디 확인
router.post('/check', checkUserId);

// 로그인
router.post('/login', loginUser);

// 로그아웃
router.post('/logout', logoutUser);

// 로그인된 사용자만 접근 가능 예시
router.get('/profile', loginRequired, (req, res) => {
    res.json({ message: '로그인된 사용자만 접근 가능합니다.', user: req.body.currentUser });
});



export default router;

