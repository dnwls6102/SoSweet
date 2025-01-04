'use client';

import styles from './page.module.css';
import SmallForm from '@/components/smallForm';
import Input from '@/components/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // 이미 로그인되어 있는지 확인
    const token = Cookies.get('access');
    console.log('hihi');
    if (token) {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        console.log('현재 로그인된 유저 정보:', decoded);
        // 필요한 경우 상태에 저장
        setId(decoded.user_id);
      } catch (error) {
        console.error('토큰 디코딩 실패:', error);
      }
    } else {
      console.log('test2');
    }
  }, []);

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
        // 로그인 성공 후 토큰 확인
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
