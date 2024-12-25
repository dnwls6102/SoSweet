import styles from './page.module.css';
import SmallForm from '@/components/smallForm';

export default function Main() {
  return (
    <div className={styles.wrapper}>
      <SmallForm>
        <p className={styles.logo}>💖소스윗</p>
      </SmallForm>
    </div>
  );
}
