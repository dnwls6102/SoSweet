import styles from './guideModal.module.css';

interface GuideModalProps {
  message: string;
}

export default function GuideModal({ message }: GuideModalProps) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.title}>지금이야!</div>
      <p className={styles.message}>&ldquo;{message}&rdquo; 라고</p>
      <p className={styles.subMessage}>상대방에게 제안해보자!</p>
    </div>
  );
}
