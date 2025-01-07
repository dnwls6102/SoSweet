'use client';

import styles from './navbarIcon.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NavbarIcon() {
  const router = useRouter();

  const tryLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/users/logout`,
        {
          // const response = await fetch('http://localhost:4000/users/logout', {
          method: 'POST',
          credentials: 'include',
        },
      );
      if (response.ok) {
        console.log('로그아웃 성공');
        router.replace('/');
      } else {
        const data = await response.json();
        console.log('로그아웃 실패 : ', data.message);
      }
    } catch (error) {
      console.error('서버 오류로 인해 로그아웃 불가');
    }
  };
  return (
    <nav className={styles.navbar}>
      <Link href="/MainPage" className={styles.link}>
        <div className={styles.logo}>
          <span className={styles.heart}>💖</span>
          <span className={styles.text}>소스윗</span>
        </div>
      </Link>
      <div className={styles.rightSection}>
        <div className={styles.logout} onClick={tryLogout}>
          로그아웃
        </div>
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
