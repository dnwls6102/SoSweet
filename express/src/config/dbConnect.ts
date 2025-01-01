/* DB 연결 설정 파일 */

const mongoose = require('mongoose');
require('dotenv').config();

const dbConnect = async () => {
    try {
        const dbURL: string = `${process.env.MONGO_URI}`; // DB 접속 url 
        // 환경 변수에 저장한 DB 연결 코드로 MongoDB 연결
        await mongoose.connect(dbURL, {dbName: "sosweet"});
        // await mongoose.connect(dbURL);
        console.log('DB Connected.');
    } catch (err) {
        console.log(err);
    }
}

// 모듈 내보내기
module.exports = dbConnect;