// 로그인 후에 요청을 보낼 때 토큰을 확인하는 모듈듈
const jwt = require('jsonwebtoken');
const updateToken = require('./refreshToken');

function loginRequired(req, res, next) {
  // const accessToken = req.headers["Authorization"]?.split(" ")[1]; // ? 옵셔널 체이닝을 이용하여 authorization값이 없거나 null일 경우 split을 실행하지 않음
  const accessToken = req.cookies.access;

  // 현재 accessToken은 토큰이거나 null 또는 undefined이다.
  // if (!accessToken || accessToken === "null") {
  if (!accessToken) {
    console.log("서비스 사용 요청이 있습니다. 하지만 Authorization 토큰: 없음");

    res.status(401).json({
      result: "forbidden-approach",
      message: "로그인한 유저만이 사용할 수 있는 서비스입니다.",
    });

    return;
  }

  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    const decoded = jwt.verify(accessToken, secretKey); // verify가 성공하면 디코딩된 Payload를 반환한다. 실패하면 에러 출력
    
    const userId = decoded.userId;
    req.currentUserId = userId; // 다른 미들웨어에서 매번 디코딩을 하지 않아도 되게 디코딩한 값을 새로운 속성을 생성하여 요청에 저장해준다.

    next(); // 다음 미들웨어로 제어를 넘기는 코드
  } catch(err) {
    if (err.name === "TokenExpiredError") {
      return updateToken(req, res, next);
    }
    else {
      return res.status(403).json({
        result: "forbidden",
        message: "Invalid access token"
      })
    }
  }
}

module.exports = loginRequired;