'use client';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MatchingPerson2() {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const man = { id: 'rgb10', name: '여자', job: '여자', gender: '여성' };

  useEffect(() => {
    // 소켓 연결 초기화
    const newSocket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
    // const newSocket = io('http://localhost:4000', {
      path: '/api/match',
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('matchSuccess', (data: { room: string }) => {
      console.log('Match success:', data);
      router.push(`/MatchingPerson2/ChatHuman?room=${data.room}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const handleMatching = () => {
    setIsMatching(true);
    if (socket) {
      socket.emit('startMatching', {
        id: man.id,
        gender: man.gender,
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
        <div className={styles.rank}>
          <span className={styles.rankText}>나의 등급:</span>
          <div className={styles.rankIcon}>
            <Image
              src="/bronze-icon.svg"
              alt="Rank Icon"
              width={80}
              height={80}
            />
          </div>
          <span className={styles.rankLevel}>브론즈</span>
        </div>

        <div className={styles.unknownPerson}>
          <Image
            className={styles.unknownPersonImage}
            src="/anonymous.png"
            alt="Unknown Person"
            width={225}
            height={225}
          />
        </div>
        <button className={styles.matchButton} onClick={handleMatching}>
          매칭 시작
        </button>
      </div>
    </div>
  );
}
