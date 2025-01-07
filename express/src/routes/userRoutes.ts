import { Router } from 'express';
import { registerUser, checkUserId } from '../controllers/userController';
import { loginRequired } from '../middlewares/authMiddleware';
import { logIn, logOut } from '../middlewares/userService'

const  router = Router();

// 회원가입
router.post("/", registerUser);

// 회원가입 - 중복 아이디 확인
router.post("/check", checkUserId);

// 로그인
router.post('/login', logIn, (req, res) => {
  console.log("로그인 성공!");
  res.status(200).json({ message: '로그인 성공'});
  // res.redirect("/MainPage");
});

// 로그아웃
router.post('/logout', logOut, (req, res) => {
  console.log("로그아웃!");
  res.status(200).json({ message: '로그아웃 성공' });
  // res.redirect("/");
});

// 로그인된 사용자만 접근 가능 예시
router.get('/profile', loginRequired, (req, res) => {
    res.json({ message: '로그인된 사용자만 접근 가능합니다.', user: req.body.currentUser });
});

// 로그아웃
router.post("/logout", logOut, (req, res) => {
  console.log("로그아웃!");
  res.status(200).json({ message: "로그아웃 성공" });
  // res.redirect("/");
});

// 로그인된 사용자만 접근 가능 예시
router.get("/profile", loginRequired, (req, res) => {
  res.json({
    message: "로그인된 사용자만 접근 가능합니다.",
    user: req.body.currentUser,
  });
});

export default router;
