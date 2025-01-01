import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User";

// 회원가입
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Received body:", req.body);

    // 1. 요청 데이터 받기
    const {
      user_id,
      user_password,
      user_nickname,
      user_birth,
      user_job,
      user_gender,
      user_level,
    } = req.body;

    // 필수 데이터 검증
    if (
      !user_id ||
      !user_password ||
      !user_nickname ||
      !user_birth ||
      !user_job ||
      !user_gender
    ) {
      res.status(400).json({ message: "모든 필드를 입력해주세요." });
      return;
    }

    // 생년월일 유효성 검증 및 처리
    if (
      !user_birth ||
      !user_birth.year ||
      !user_birth.month ||
      !user_birth.day
    ) {
      res.status(400).json({ message: "유효하지 않은 생년월일 데이터입니다." });
      return;
    }

    // 생년월일을 Date 객체로 변환
    const formattedBirthdate = new Date(
      `${user_birth.year}-${String(user_birth.month).padStart(2, "0")}-${String(
        user_birth.day
      ).padStart(2, "0")}`
    );

    // 날짜가 유효한지 확인
    if (isNaN(formattedBirthdate.getTime())) {
      res.status(400).json({ message: "올바르지 않은 생년월일입니다." });
      return;
    }

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(user_password, 10);

    // 3. 유저 데이터 생성
    const newUser: IUser = new User({
      user_id,
      user_password: hashedPassword,
      user_nickname,
      user_birth: formattedBirthdate,
      user_job,
      user_gender,
      user_level: "Bronze",
      user_state: 0,
    });

    // 4. 데이터베이스에 저장
    await newUser.save();

    // 5. 성공 응답 보내기
    res.status(201).json({ message: "회원가입 성공!", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "회원가입 실패. 서버 오류입니다." });
  }
};

// 회원가입 - 아이디 중복 확인
export const checkUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.body;

    // 요청 데이터 검증
    if (!id) {
      res.status(400).json({ message: "아이디를 입력해주세요." });
      return;
    }

    // 아이디 존재 여부 확인
    const existingUser = await User.findOne({ user_id: id });

    if (existingUser) {
      // 이미 사용 중인 아이디
      res.status(200).json({ isExists: true });
    } else {
      // 사용 가능한 아이디
      res.status(200).json({ isExists: false });
    }
  } catch (error) {
    console.error("중복 확인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다. " });
  }
};

// 로그인
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, user_password } = req.body;

    // 1. 입력 값 검증
    if (!user_id || !user_password) {
      res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
      return;
    }

    // 2. 사용자 찾기
    const user = (await User.findOne({ user_id })) as IUser;

    if (!user) {
      res.status(401).json({ message: "아이디가 존재하지 않습니다." });
      return;
    }

    // 3. 비밀번호 검증
    const isPasswordCorrect = await bcrypt.compare(
      user_password,
      user.user_password
    );
    if (!isPasswordCorrect) {
      res.status(401).json({ message: "비밀번호가 잘못되었습니다." });
      return;
    }

    // 4. 로그인 상태 관리: 세션 또는 간단한 쿠키 저장
    // 예: 세션 ID를 생성하거나 사용자 고유 ID를 쿠키로 전달
    res.cookie("session_id", user._id.toString(), {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1시간
    });

    // 5. 성공 응답
    res.status(200).json({ message: "로그인 성공", userId: user._id });
  } catch (error) {
    console.log("로그인 오류: ", error);
    res
      .status(500)
      .json({ message: "로그인 처리 중 서버 오류가 발생했습니다." });
  }
};

// 로그아웃
export const logoutUser = (req: Request, res: Response): void => {
  res.clearCookie("session_id"); // 세션 쿠키 삭제
  res.status(200).json({ message: "로그아웃 성공" });
};
