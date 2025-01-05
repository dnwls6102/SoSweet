import { Router } from "express";
import logInRequired from "../middlewares/loginRequired";
import { recordDialog, endChat } from "../middlewares/talkWithPerson";
import { chatMiddleware ,endChatWithAI } from "../middlewares/talkWithAI";
import { chatAnalysis } from "../middlewares/chatAnalysis";
import { ttsMiddleware } from "../middlewares/tts";
import { sendFaceInfoToFlask, sendMotionInfoFlask } from "../controllers/flaskController";


const api = Router();

api.use("/", logInRequired);

api.post("/ai/dialog", chatMiddleware, ttsMiddleware);

api.post("/ai/dialog/end", endChatWithAI, chatAnalysis);

api.post("/human/dialog", recordDialog);

api.post("/human/dialog/end", endChat, chatAnalysis);


// flask 서버와 연결
api.post("/human/faceinfo", (req, res) => {
    console.log("Face info 요청 들어옴:", req.body);
    sendFaceInfoToFlask(req, res);
});

api.post("/human/actioninfo", (req, res) => {
    console.log("Action info 요청 들어옴:", req.body);
    sendMotionInfoFlask(req, res);
});


export default api;