import { Router } from 'express';
import { registerUser, checkUserId } from '../controllers/userController';

const router = Router();

// 회원가입
router.post('/', registerUser);

// 회원가입 - 중복 아이디 확인
router.post('/check', checkUserId);

export default router;

