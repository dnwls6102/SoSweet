'use client';

import styles from './navbarIcon.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setReduxSocket, setRoom } from '../store/socketSlice';

export default function NavbarIcon() {
  const router = useRouter();
  const socket = useSelector((state: RootState) => state.socket.socket);
  const dispatch = useDispatch();

  const tryLogout = async () => {
    // 로그아웃 시 서버의 대기열에서 제거하기
    if (socket) {
      socket.emit('match-disconnect');
      socket.disconnect();
      dispatch(setReduxSocket(null));
      dispatch(setRoom(null));
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/users/logout`,
        {
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
      console.error('서버 오류로 인해 로그아웃 불가 : ', error);
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
            width={60} // 원하는 크기로 설정
            height={60}
          />
        </Link>
      </div>
    </nav>
  );
}
