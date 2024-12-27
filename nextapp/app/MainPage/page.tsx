'use client';

import React from 'react';
import styles from './page.module.css';
import Link from 'next/link';

const MainPage = () => {

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <Link href="/MatchingAI" className={styles.link}>
          <div className={`${styles.option} ${styles.ai}`}>
          <div className={styles.icon}>🤖</div>
          <span className={styles.label}>AI</span>
        </div>
        </Link>
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
