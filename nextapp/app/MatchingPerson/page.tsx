'use client';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  user_id: string;
  user_gender: string;
  iat: number;
  exp: number;
}

export default function MatchingPerson() {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const token = Cookies.get('access');
  let ID = '';
  let gender = '';

  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    ID = decoded.user_id;
    gender = decoded.user_gender;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  useEffect(() => {
    // 소켓 연결 초기화
    const newSocket = io('http://localhost:4000', {
      path: '/api/match',
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('matchSuccess', (data: { room: string }) => {
      console.log('Match success:', data);
      router.push(`/MatchingPerson/ChatHuman?room=${data.room}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleMatching = () => {
    setIsMatching(true);
    if (socket) {
      socket.emit('startMatching', {
        id: ID,
        gender: gender,
      });
    }
  };

  if (isMatching) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingText}>매칭 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <Image
            src="/matching-illustration.svg"
            alt="Matching Illustration"
            width={650}
            height={650}
            className={styles.matchImage}
          />
        </div>
        <div className={styles.rightSection}>
          <div className={styles.rankContainer}>
            <span className={styles.rankText}>나의 등급</span>
            <Image
              src="/bronze-icon.svg"
              alt="Rank Icon"
              width={60}
              height={60}
              className={styles.rankIcon}
            />
            <span className={styles.rankLevel}>브론즈</span>
          </div>
          <button className={styles.matchButton} onClick={handleMatching}>
            매칭 시작
          </button>
        </div>
      </div>
    </div>
  );
}
