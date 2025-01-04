import { Router } from "express";
import logInRequired from "../middlewares/loginRequired";
import { recordDialog, endChat } from "../middlewares/talkWithPerson";
import { chatMiddleware ,endChatWithAI } from "../middlewares/talkWithAI";
import { chatAnalysis } from "../middlewares/chatAnalysis";
import { ttsMiddleware } from "../middlewares/tts";



const api = Router();

api.use("/", logInRequired);

api.post("/ai/dialog", chatMiddleware, ttsMiddleware);

api.post("/ai/dialog/end", endChatWithAI, chatAnalysis);

api.post("/human/dialog", recordDialog);

api.post("/human/dialog/end", endChat, chatAnalysis);


export default api;