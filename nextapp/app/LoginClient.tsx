'use client';

import styles from './page.module.css';
import SmallForm from '@/components/smallForm';
import Input from '@/components/input';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
          credentials: "include",
        },
      );
      if (response.ok) {
        console.log('로그인 성공');
        alert('로그인 성공!');
        router.replace('/MainPage');
      } else {
        console.error('로그인 실패');
        alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
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
        <Input
          placeholder="아이디"
          value={user_id}
          onChange={(e) => setId(e.target.value)}
          type="text"
        />
        <div className={styles.contentwrapper}>
          <Input
            placeholder="비밀번호"
            value={user_password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>
        <div className={styles.inlinewrapper}>
          <Link href="/Signin">
            <button className={styles.button}>회원가입</button>
          </Link>
          <button className={styles.button} onClick={tryLogin}>
            로그인
          </button>
        </div>
      </SmallForm>
    </div>
  );
}
