import styles from './yellowModal.module.css';
import Image from 'next/image';

interface YellowWarningModalProps {
  message: string;
}

export default function YellowWarningModal({ message }: YellowWarningModalProps) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.warningIcon}>
      <Image 
        src="/yellowWarning.svg" 
        alt="yellowIcon" 
        width={80} 
        height={80} 
        className={styles.warningIcon}
      />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
