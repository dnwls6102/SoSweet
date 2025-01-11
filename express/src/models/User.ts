import mongoose, { Schema, Document, Types } from "mongoose";

// User 인터페이스 (TS 타입 정의)
export interface IUser extends Document {
  _id: Types.ObjectId;
  user_id: string;
  user_password: string;
  user_nickname: string;
  user_birth: Date;
  user_job: string;
  user_photo: string;
  user_gender: "남성" | "여성";
  user_level: "Bronze" | "Silver";
}

const UserSchema: Schema = new Schema({
  user_id: { type: String, required: true, unique: true },
  user_password: { type: String, required: true },
  user_nickname: { type: String, required: true },
  user_birth: { type: Date, required: true },
  user_job: { type: String, required: true },
  user_photo: { type: String }, // 선택 필드
  user_gender: { type: String, enum: ["남성", "여성"], required: true },
  user_level: {
    type: String,
    enum: ["Bronze", "Silver"],
    required: true,
    default: "Bronze",
  },
});

export default mongoose.model<IUser>("User", UserSchema);
