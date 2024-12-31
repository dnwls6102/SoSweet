/* DB 연결 설정 파일 */

const mongoose = require('mongoose');
require('dotenv').config();

const dbConnect = async () => {
    try {
        const dbURL: string = `mongodb://${process.env.MDB_USER}:${process.env.MDB_PW}@localhost:27017`; // DB 접속 url 
        // 환경 변수에 저장한 DB 연결 코드로 MongoDB 연결
        await mongoose.connect(dbURL, {dbName: process.env.DB_NAME});
        console.log('DB Connected.');
    } catch (err) {
        console.log(err);
    }
}

// 모듈 내보내기
module.exports = dbConnect;