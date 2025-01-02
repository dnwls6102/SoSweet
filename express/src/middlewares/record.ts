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

const conversation: {role: string; content: string; name:string}[] = [];

function recordConversation(req: Request, res: Response) {
  const { ID, script} = req.body

  conversation.push({ role: "user", content: script, name: ID });
  console.log(conversation);
  
  // req.body.script = conversation;
  res.status(200).json({ message: "대화 저장 완료"})
}


function endChat(req: Request, res: Response, next: NextFunction): void {
  req.body.script = conversation;
  console.log(req.body.script);
  conversation.length = 0;
  next();
}

export { genConId, recordConversation, endChat };