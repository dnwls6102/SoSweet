// Access Token이 만료됐을 때, Refresh Token을 확인하고 유효하면 새 Access Token을 생성해서 응답으로 보내주는 모듈
const jwt = require('jsonwebtoken');
const { renewToken } = require('./jwt'); // {}를 통해 객체를 디스트럭처링해서 원하는 속성만을 가져온다.

const updateToken = (req, res, next) => {
  const refreshToken = req.cookies.refresh;
  
  if(!refreshToken) {
    return res.status(401).json({message: "Refresh Token is Missing"}); // 리프레쉬 토큰이 없을 때 에러 코드 출력
  }
  
  try {
    const accessToken = req.cookies.access;
    const newToken = renewToken(accessToken, refreshToken);

    if(!newToken) {
      console.error('Failed to generate new access token');
      return res.status(401).json({message: 'Failed to generate new access token'});
    }
    // res.setHeader('Authorization', `Bearer ${newToken}`); // 새로 생성한 Access 토큰을 Header에 저장해줌.
    res.cookie("access", newToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // 필요에 따라 조정
      sameSite: 'lax', // 조정 가능
      maxAge: 3600000 // 1시간
    });

    req.cookies.access = newToken; // next()작업을 수행하기 위해서 요청 객체의 쿠키를 수정했다.
  } catch(e) {
    console.error(e);
    return res.status(401).send({message: "Invalid Token"})
  }

  return next();
}

module.exports = updateToken;