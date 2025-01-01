import { Request, Response, NextFunction } from 'express';

function genConId(userId1: string, userId2: string): string {
  const sortedUsers = [userId1, userId2].sort();
  const conversationId = `${sortedUsers[0]}-${sortedUsers[1]}`;
  return conversationId;
}

const conversations: Record<string, { userId: string; script: string}[]> = {};

function recordConversation(req: Request, res: Response, next: NextFunction) {
  const {conversationId, userId, script} = req.body;

  if(!conversations[conversationId]) {
    conversations[conversationId] = [];
  }

  conversations[conversationId].push({ userId, script });

}

export {genConId, recordConversation};