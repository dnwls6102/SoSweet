/* 임시로 만든 User 스키마 및 모델 */

const userSchema = require('mongoose').Schema({
    id: {
        type: String,
        required: true,
    },
    gender: {
        type: Number,
        required: true,
    },
    state: {
        type: Number,
        required: true,
    }
}, {timestamps: true}); // 생성 일자와 갱신 일자 자동 업데이트(optional)

const User = require('mongoose').model('User', userSchema);

// User 모델 내보내기
module.exports = User;