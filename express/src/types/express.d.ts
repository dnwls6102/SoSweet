import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    responseText?: string; // 기존에 없는 속성을 전역 타입으로 선언
  }
}