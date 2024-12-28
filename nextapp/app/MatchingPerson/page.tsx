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
