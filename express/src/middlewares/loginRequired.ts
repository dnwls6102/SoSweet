import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import updateToken from './refreshToken';

declare module 'express' {
  interface Request {
    currentUserId?: string;
  }
}

const logInRequired = (req: Request, res: Response, next: NextFunction): void => {
  const accessToken = req.cookies.access;

  if(!accessToken) {
    console.log("권한이 없는 서비스 요청이 있습니다.(Access 토큰 없음)");

    res.status(401).json({
      result: "forbidden-approach",
      message: "로그인한 유저만이 사용할 수 있는 서비스입니다.",
    });
    return;
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY; // 환경 변수로 들어가는 값은 기본적으로 string|undefined 자료형을 가진다.
    if (!secretKey) {
      throw new Error("JWT_SECRET_KEY가 환경 변수에 설정되지 않았습니다. 서버 환경 설정을 확인하세요.")
    }

    const decoded = jwt.verify(accessToken, secretKey); // verify는 string이외의 값은 허용하지 않으므로, secretKey가 undefined일 경우에 대한 예외 처리를 해줘야 한다.
    // jwt.verify의 반환값의 자료형은 string|JwtPayLoad 라서, string형으로 반환되었을 경우에 대한 타입가드를 추가해줘야 한다.
    if (!decoded || typeof decoded == 'string' || typeof decoded.user_id !== 'string') {
      throw new Error();
    }

    const user_id = decoded.user_id;
    req.currentUserId = user_id;

    next();
  } catch(err) {
    const error = err as Error;
    console.error("토큰 인증 중 에러가 발생했습니다:", err);
    if(error.name === "TokenExpiredError") {
      updateToken(req, res, next);
      return;
    }
    else {
      res.status(403).json({
        result:"forbidden-approach",
        message: "유효하지 않은 토큰입니다."
      })
    }
  }
}

export default logInRequired;
