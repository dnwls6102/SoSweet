'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import SmallForm from '@/components/smallForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  const [toastMsg, setToastMsg] = useState(''); // 토스트 메시지
  const [showToast, setShowToast] = useState(false); // 토스트 표시 여부

  // 토스트 메시지 3초 후 자동 닫기
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000); // 3초 후 토스트 닫기
      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 제거
    }
  }, [showToast]);

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
        setToastMsg('로그인 성공!');
        setShowToast(true);

        // 1초 후 페이지 이동
        setTimeout(() => {
          router.replace('/MainPage');
        }, 700);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: '로그인 실패' }));
        console.error('로그인 실패:', errorData.message);
        setToastMsg(
          errorData.message ||
            '로그인 실패: 아이디 또는 비밀번호를 확인해주세요.',
        );
        setShowToast(true);
      }
    } catch (error) {
      console.error('서버 오류:', error);
      setToastMsg('로그인 중 알 수 없는 오류가 발생했습니다.');
      setShowToast(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <SmallForm>
        <p className={styles.logo}>💖소스윗</p>
        <div className={styles.contentwrapper}>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>아이디</label>
            <input
              className={styles.input}
              placeholder="아이디를 입력하세요"
              value={user_id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={user_password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
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
      {showToast && (
        <div className={styles.toast}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}