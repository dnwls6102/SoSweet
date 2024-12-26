import styles from './navbar.module.css';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/MainPage" className={styles.link}>
        <div className={styles.logo}>
          <span className={styles.heart}>💖</span>
          <span className={styles.text}>소스윗</span>
        </div>
      </Link>
      <Link href="/" className={styles.link}>
        <div className={styles.logout}>로그아웃</div>
      </Link>
    </nav>
  );
}
