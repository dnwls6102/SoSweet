import { Request, Response, NextFunction } from 'express';

function genConId(userId1: string, userId2: string): string {
  const sortedUsers = [userId1, userId2].sort();
  const conversationId = `${sortedUsers[0]}-${sortedUsers[1]}`;
  return conversationId;
}

// const conversations: Record<string, { userId: string; script: string}[]> = {};

// function recordConversation(req: Request, res: Response) {
//   const {conversationId, userId, script} = req.body;
//   console.log(req.body);
//   console.log(conversationId, userId, script);

//   if(!conversations[conversationId]) {
//     conversations[conversationId] = [];
//   }

//   conversations[conversationId].push({ userId, script });
//   console.log(conversations[conversationId]);
  
//   res.status(200).json({"message": "대화 기록 저장 완료"});
// }

let conversation: {role: string; content: string; name:string}[] = [];

function recordConversation(req: Request, res: Response) {
  const { userId, script} = req.body;
  console.log(req.body);
  console.log( userId, script);

  conversation.push({ role: "user", content: script, name: userId });
  console.log(conversation);
  
  res.status(200).json({"message": "대화 기록 저장 완료"});
}

export {genConId, recordConversation};