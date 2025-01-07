import { Request, Response, NextFunction } from "express";
import { renewToken } from "./jwt";
import { setCookies } from "./userService";

const updateToken = (req: Request, res: Response, next: NextFunction): void => {
  const refreshToken = req.cookies?.refresh;

  if (!refreshToken) {
    res.status(401).json({ message: "refreshToken이 존재하지 않습니다." });
    return;
  }

  try {
    const accessToken = req.cookies?.access;
    const newToken: string | null = renewToken(accessToken, refreshToken);

    if (!newToken) {
      console.error("새 토큰을 생성하는데 실패했습니다.");
      res.status(401).json({ message: "새 토큰을 생성하는데 실패했습니다." });
      return;
    }
    // 밑에 쿠키 설정하는 거 함수로 따로 빼주기.

    setCookies(newToken, res, "access");

    req.cookies.access = newToken;
    next();
  } catch (error) {
    console.error("토큰 갱신 중 에러 발생", error);
    res.status(401).json({ message: "토큰이 유효하지 않습니다." });
    return;
  }
};

export default updateToken;
