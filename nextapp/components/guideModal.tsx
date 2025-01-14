import styles from './guideModal.module.css';
import Image from 'next/image';

interface GuideModalProps {
  message: string;
}

export default function GuideModal({ message }: GuideModalProps) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.alertIcon}>
      <Image 
        src="/alert.svg" 
        alt="alertIcon" 
        width={75} 
        height={75} 
        className={styles.alertIcon}
      />
      </div>
      <div className={styles.title}>지금이야!</div>
      <p className={styles.message}>&ldquo;{message}&rdquo;</p>
      <p className={styles.subMessage}>라고 제안해보자!</p>
    </div>
  );
}
