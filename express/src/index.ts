import app from './app';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드

const PORT = process.env.PORT || 3000; // .env 에서 PORT 가져오기, 기본값 3000

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
