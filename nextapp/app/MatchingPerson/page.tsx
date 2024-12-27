'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const MatchingPerson = () => {
  const router = useRouter();

  const handleMatching = () => {
    router.push('/MatchingPerson/ChatHuman');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.rank}>
          나의 등급:
          <Image
            className={styles.rankIcon}
            src="/rankBronze.png"
            alt="Rank Icon"
            width={48}
            height={48}
          />
          브론즈
        </h2>
        <div className={styles.unknownPerson}>
          <Image
            className={styles.unknownPersonImage}
            src="/unknownPerson.png"
            alt="Unknown Person"
            width={150}
            height={150}
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
