import { Router } from "express";
// import logInRequired from "../middlewares/loginRequired";
import { recordDialog, endChat } from "../middlewares/talkWithPerson";
import {
  initChat,
  chatMiddleware,
  endChatWithAI,
} from "../middlewares/talkWithAI";
import { chatAnalysis } from "../middlewares/chatAnalysis";
import { initTTS, ttsMiddleware } from "../middlewares/tts";
import { sendFrameInfoToFlask } from "../controllers/flaskController";
import genPrompt from "../middlewares/createPrompt";

const api = Router();

api.post("/ai/dialog/start", genPrompt, initChat, initTTS);

api.post("/ai/dialog", chatMiddleware, ttsMiddleware);

api.post("/ai/dialog/end", endChatWithAI, chatAnalysis);

api.post("/human/dialog", recordDialog);

api.post("/human/dialog/end", endChat, chatAnalysis);

// flask 서버와 연결
api.post("/human/frameInfo", (req, res) => {
  // console.log("Frame info 요청 들어옴:", req.body);
  sendFrameInfoToFlask(req, res);
});

export default api;
