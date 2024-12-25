import Image from 'next/image';
import Link from 'next/link'; // Link 컴포넌트 추가
import styles from './header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/MainPage" className={styles.logoLink}>
          <span className={styles.heart}>💖 </span>
          <span className={styles.title}> 소스윗</span>
        </Link>
      </div>
      <div className={styles.logoutContainer}>
        <button className={styles.logout}>Logout</button>
        <Image className={styles.mypage} src="/mypage.png" alt="Logo" width={50} height={50} />
      </div>
    </header>
  );
};

export default Header;
