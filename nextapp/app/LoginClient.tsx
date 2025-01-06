'use client';

import styles from './page.module.css';
import SmallForm from '@/components/smallForm';
import Input from '@/components/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  user_id: string;
  iat: number;
  exp: number;
}

export default function LoginClient() {
  const [user_id, setId] = useState('');
  const [user_password, setPassword] = useState('');
  const router = useRouter();

  const tryLogin = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/users/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id, user_password }),
          credentials: 'include',
        },
      );

      if (response.ok) {
        console.log('로그인 성공');
        const token = Cookies.get('access');
        if (token) {
          const decoded = jwtDecode<UserPayload>(token);
          console.log('로그인된 유저 정보:', decoded);
        }
        alert('로그인 성공!');
        router.replace('/MainPage');
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: '로그인 실패' }));
        console.error('로그인 실패:', errorData.message);
        alert(
          errorData.message ||
            '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.',
        );
      }
    } catch (error) {
      console.error('서버 오류:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <SmallForm>
        <p className={styles.logo}>💖소스윗</p>
        <div className={styles.contentwrapper}>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>아이디</label>
            <input className={styles.input} placeholder="아이디를 입력하세요" />
          </div>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
        </div>
        <div className={styles.inlinewrapper}>
          <Link href="/Signin">
            <button className={styles.button}>회원가입</button>
          </Link>
          <Link href="/MainPage">
            <button className={styles.button}>로그인</button>
          </Link>
        </div>
      </SmallForm>
    </div>
  );
}
