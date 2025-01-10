'use client';

import React from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import Cookies from 'js-cookie';
// import { jwtDecode } from 'jwt-decode';

// interface UserPayload {
//   user_id: string;
//   user_gender: string;
//   iat: number;
//   exp: number;
// }

const MainPage = () => {
  const router = useRouter();
  // const token = Cookies.get('access');
  // let ID = '';
  // let gender = '';
  // if (token) {
  //   const decoded = jwtDecode<UserPayload>(token);
  //   ID = decoded.user_id;
  //   gender = decoded.user_gender;
  // }

  // const handleNavigation = async () => {
  //   try {
  //     const response = await fetch('https://back.sosweet.site/api/ai/dialog/start', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         user_id: ID,
  //         user_gender: gender,
  //       }),
  //     });
  //     if (response.ok) {
  //       console.log('성공')
  //     } else {
  //       console.error('서버에서 200 반환안함함');
  //     }
  //   } catch (error) {
  //     console.error('서버 요청 전송 오류:', error);
  //   }
  //   router.replace('/ChatAI');
  // };

  const handleNavigation = () => {
    router.push('/SetAI');
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div
          className={`${styles.option} ${styles.ai}`}
          onClick={handleNavigation}
        >
          <div className={styles.icon}>🤖</div>
          <span className={styles.label}>AI</span>
        </div>
        <Link href="/MatchingPerson" className={styles.link}>
          <div className={`${styles.option} ${styles.human}`}>
            <div className={styles.icon}>🧑</div>
            <span className={styles.label}>사람</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MainPage;
