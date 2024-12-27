'use client';

import React from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

const MainPage = () => {
  const router = useRouter(); // useRouter 훅을 사용하여 router 객체를 가져옵니다.

  const handleAiClick = () => {
    router.push('/MatchingAI'); // /MatchingAI로 이동 (app/MatchingAI/page.tsx와 연결)
  };

  const handlePersonClick = () => {
    router.push('/MatchingPerson');
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div
          className={`${styles.option} ${styles.ai}`}
          onClick={handleAiClick}
        >
          <div className={styles.icon}>🤖</div>
          <span className={styles.label}>AI</span>
        </div>
        <div
          className={`${styles.option} ${styles.human}`}
          onClick={handlePersonClick}
        >
          <div className={styles.icon}>🧑</div>
          <span className={styles.label}>사람</span>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
