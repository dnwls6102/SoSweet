import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { genAccessToken, genRefreshToken, TokenPayload } from './jwt';
import { error } from 'console';
import User, { IUser } from '../models/User';
const secretKey = process.env.JWT_SECRET_KEY as string;

declare global {
  namespace Express {
    interface Request {
      cookies: {
        access?: string;
        refresh?: string;
      };
    }
  }
}

type cookieType = 'access' | 'refresh';

const setCookies = ( token: string, res:Response, type: cookieType ): void => {
  const time = type === 'access' ? 3 : 24;

  res.cookie( type, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 조정 가능
    maxAge: 3600000 * time
  });
};

async function logIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user_id, user_password } = req.body;
    if (!user_id || !user_password) {
      res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요."});
      return;
    }

    const user = (await User.findOne({ user_id})) as IUser; // 객체의 속성과 변수 이름이 같다면, 객체 속성을 생략해서 코드를 단축시킬 수 있다.
    
    if(!user) {
      res.status(404).json({ message: "가입되어 있지 않은 아이디 입니다." });
      return;
    }
  
    const isMatched = await bcrypt.compare( user_password, user.user_password );
  
    if(!isMatched) {
      res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
      return;
    }
  
    const payload: TokenPayload = {
      user_id: user.user_id,
      user_nickname: user.user_nickname,
      user_birth: user.user_birth,
      user_job: user.user_job,
      user_gender: user.user_gender,
    };
  
    const accessToken: string = genAccessToken(payload);
    const refreshToken: string = genRefreshToken(payload);
  
    setCookies(accessToken, res, 'access');
    setCookies(refreshToken, res, 'refresh');
  
    next();
  } catch(error) {
    console.error("로그인 시도 중에 에러가 발생했습니다.", error);
    res.status(500).json({ message: "서버 오류로 인해 로그인할 수 없습니다."});
  }
}

const logOut = (req: Request, res: Response, next: NextFunction): void => {
  const accessToken = req.cookies?.access;
  const refreshToken = req.cookies?.refresh;

  if(!accessToken || !refreshToken) {
    console.log('토큰 없음');
    res.status(400).json({ message: "토큰이 없습니다, 로그인 상태를 확인하세요."});
    return;
  }

  res.clearCookie('access');
  console.log('access 토큰 삭제');

  try {
    // jwt.verify(refreshToken, secretKey);
    res.clearCookie('refresh');
    next();
  } catch(error) {
    res.status(401).json({ message: "유효하지 않은 refresh 토큰입니다." })
  }
}

export { logIn, logOut, setCookies };
