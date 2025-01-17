import styles from './chatbot.module.css';
import { useState } from 'react';

interface ChatbotProps {
  emotion: string;
  message: string;
}

const emotionToEmoji: Record<string, string> = {
  긴장: '😰',
  불편함: '😖',
  두려움: '😱',
  기쁨: '😄',
  슬픔: '😢',
  놀람: '😲',
  평온함: '😊',
};

export default function Chatbot({ emotion, message }: ChatbotProps) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className={styles.chatbotContainer}>
      {showMessage && <div className={styles.messageBox}>{message}</div>}
      <div
        className={styles.emojiWrapper}
        onMouseEnter={() => setShowMessage(true)}
        onMouseLeave={() => setShowMessage(false)}
      >
        {emotionToEmoji[emotion]}
      </div>
    </div>
  );
}
