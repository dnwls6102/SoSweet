import styles from './page.module.css';

export default function Chat() {
  return (
    <div className={styles.chatContainer}>
      <button className={styles.endButton}>대화 종료</button>
    </div>
  );
}
