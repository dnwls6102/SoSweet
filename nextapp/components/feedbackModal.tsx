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
          <Image 
            src="/warning.svg" 
            alt="warningIcon" 
            width={55} 
            height={55} 
            className={styles.warningIcon}
          />
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
