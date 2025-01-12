import styles from './feedbackModal.module.css';

interface FeedbackModalProps {
  message: string;
}

export default function FeedbackModal({ message }: FeedbackModalProps) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
