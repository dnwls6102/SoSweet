'use client';

import React from 'react';
import Image from 'next/image';
import Header from '../../components/header'; // Header 경로 수정!
import styles from './page.module.css';

const MatchingPerson = () => {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <h2 className={styles.rank}>
          나의 등급:
          <Image
            className={styles.rankIcon}
            src="/rankBronze.png" /* 등급 아이콘 경로 */
            alt="Rank Icon"
            width={48}
            height={48}
          />
          브론즈
        </h2>
        <div className={styles.unknownPerson}>
          <Image
            className={styles.unknownPersonImage}
            src="/unknownPerson.png" /* Unknown Person 이미지 경로 */
            alt="Unknown Person"
            width={150}
            height={150}
          />
        </div>
        <button className={styles.matchButton}>매칭 시작</button>
      </div>
    </div>
  );
};

export default MatchingPerson;
