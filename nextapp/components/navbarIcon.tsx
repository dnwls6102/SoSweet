import styles from './navbarIcon.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function NavbarIcon() {
  return (
    <nav className={styles.navbar}>
      <Link href="/MainPage" className={styles.link}>
        <div className={styles.logo}>
          <span className={styles.heart}>💖</span>
          <span className={styles.text}>소스윗</span>
        </div>
      </Link>
      <div className={styles.rightSection}>
        <Link href="/" className={styles.link}>
          <div className={styles.logout}>로그아웃</div>
        </Link>
        <Link href="/MyPage" className={styles.link}>
          <Image
            src="/MyPageLogo.svg"
            alt="My Page Logo"
            width={50} // 원하는 크기로 설정
            height={50}
          />
        </Link>
      </div>
    </nav>
  );
}
