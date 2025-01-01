// JWT 토큰을 생성하고, refresh토큰을 확인하고 새 토큰을 발행해주는 모듈
const jwt = require('jsonwebtoken') 
require('dotenv').config(); // 
const secretKey = process.env.JWT_SECRET_KEY;

const genAccessToken = (payload) => { // Refresh 토큰과 Access토큰 모두 해당 함수로 만들기 때문에, 지금은 두 토큰에 담기는 Payload가 동일하다. 필요할 시에 분리해야 한다.
  const token = jwt.sign(payload, secretKey, {expiresIn: '30s'}); // 토큰이 발급 후 1시간 뒤에 만료되게 설정
  return token;
}

const genRefreshToken = (payload) => {
  const minimalPayload = { userId: payload.userId };
  const token = jwt.sign(minimalPayload, secretKey, {expiresIn: '1d'})
  return token;
}

const renewToken = (access,refresh) => { // 현재는 refresh 토큰의 Payload를 기반으로 새로운 Access Token을 생성하는데, 실제로는 Access 토큰과 refresh 토큰 둘 다를 인자로 받아서, refresh토큰의 유효성 검사를 한 뒤에 만료된 access 토큰의 payload를 가져와서 새로운 토큰을 생성해야 한다.
  try {
    // 유저로부터 받은 토큰 유효성 검사, 실패 시 에러를 반환, 성공 시에는 Payload부분을 디코딩해서 반환
    const decodedRefresh = jwt.verify(refresh, secretKey);
    if(!decodedRefresh) {
      console.error('Invalid refresh token');
      return null;
    }

    const decodedAccess = jwt.decode(access); // Payload를 디코딩하는데는 secret-key가 필요하지 않다. 오히려 secretKey를 넣으면 Signature 유효성 검사가 들어가서 만료된 토큰이 걸러질 수 있다.
    if (!decodedAccess) { // decode메소드는 디코딩에 실패하면(JSON형식이 아니면) null을 반환한다.
      console.error('Invalid access token format');
      return null;
    }

    if (decodedAccess.userId !== decodedRefresh.userId) { // 보안을 강화하기 위해 !==로 비교
      console.error('Access Token and Refresh Token do not match each other');
      return null;
    }

    const payload = {
      userId: decodedAccess.userId, // 사용자 이름
      // isAdmin: decodedAccess.isAdmin // 관리자 여부, 불 대수  
    };
    
    const newToken = genAccessToken(payload); // 새 Access 토큰 생성
    return newToken;
  } catch(e) {
    console.error('Error while renewing token', error);
    return null;
  }
}

module.exports = { genAccessToken, genRefreshToken, renewToken };


// {
//   "dependencies": {
//     "bcrypt": "^5.1.1",
//     "cookie-parser": "^1.4.7",
//     "jsonwebtoken": "^9.0.2",
//   }
// }