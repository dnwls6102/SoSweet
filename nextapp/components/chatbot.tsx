import styles from './chatbot.module.css';

interface ChatbotProps {
  emotion: string;
  message?: string;
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
  return (
    <div className={styles.chatbotContainer}>
      {message && <div className={styles.messageBox}>{message}</div>}
      <div className={styles.emojiWrapper}>
        {emotionToEmoji[emotion]}
      </div>
    </div>
  );
}
