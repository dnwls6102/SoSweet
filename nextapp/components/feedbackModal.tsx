import styles from './feedbackModal.module.css';
import Image from 'next/image';

interface FeedbackModalProps {
  message: string;
}

export default function FeedbackModal({ message }: FeedbackModalProps) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.warningIcon}>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
