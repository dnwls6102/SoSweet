'use client';

import React, { useEffect } from 'react';
import io from 'socket.io-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const MatchingPerson = () => {
  const router = useRouter();

  const man = { id: 'dnwls6102', name: '한량', job: '한량', gender: '남성' };

  //   useEffect(() => {
  //     const socket = io('http://localhost:4000', {
  //       path: '/api/match',
  //       withCredentials: true,
  //     });

  //     socket.on('connect', () => {
  //       console.log(`Socket connected in MP: ${socket.id}`);
  //     });

  //     socket.on('disconnect', () => {
  //       console.log('Socket disconnected');
  //     });

  //     socket.on('connect_error', (err) => {
  //       console.error('Connection error:', err);
  //     });

  //     return () => {
  //       socket.disconnect();
  //     };
  //   }, []);

  const handleMatching = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(man),
      });

      if (response.ok) {
        console.log('매칭 성공');
        router.push('/MatchingPerson2/ChatHuman');
      }
    } catch {
      console.log('매칭 실패');
    }
  };

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
};

export default MatchingPerson;
