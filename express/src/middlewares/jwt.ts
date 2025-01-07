import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY; // 환경변수에 값이 없을 경우를 대비하여, 값이 null 또는 undefined일 경우에 빈 문자열을 넣어준다.

if (!secretKey) {
  throw new Error("비밀 키가 환경 변수에 존재하지 않습니다.");
}

export interface TokenPayload {
  user_id: string;
  user_nickname: string;
  user_birth: Date;
  user_job: string;
  user_gender: "남성" | "여성";
  [key: string]: any; // 해당 형식을 따르는 속성이 언제든 추가될 수 있게 유연하게 처리하는 방법
}

const isTokenPayload = (payload: any): payload is TokenPayload => {
  // payload의 형식을 검증하는 함수, 지금은 payload의 user_id가 문자열인지만 확인한다.
  return payload && typeof payload.user_id === "string";
};

const genAccessToken = (payload: TokenPayload): string => {
  const token: string = jwt.sign(payload, secretKey, { expiresIn: "1h" });
  return token;
};

const genRefreshToken = (payload: Pick<TokenPayload, "user_id">): string => {
  const token: string = jwt.sign(payload, secretKey, { expiresIn: "1d" });
  return token;
};

const renewToken = (access: string, refresh: string): string | null => {
  try {
    const decodedRefresh = jwt.verify(refresh, secretKey) as TokenPayload;

    if (!decodedRefresh) {
      console.error("refresh Token이 유효하지 않습니다.");
      return null;
    }

    const decodedAccess = jwt.decode(access) as JwtPayload | null;

    if (
      !decodedAccess ||
      typeof decodedAccess === "string" ||
      !isTokenPayload(decodedAccess)
    ) {
      console.error("유효하지 않는 토큰 형식입니다.");
      return null;
    }

    if (decodedRefresh.user_id !== decodedAccess.user_id) {
      console.error("토큰 정보가 서로 일치하지 않습니다.");
      return null;
    }

    const {exp, iat, ...payload } = decodedAccess;
    console.log(payload);
    const newToken: string = genAccessToken(payload);
    return newToken;
  } catch (error) {
    console.error("토큰 갱신에 실패했습니다.", error);
    return null;
  }
};

export { genAccessToken, genRefreshToken, renewToken };
