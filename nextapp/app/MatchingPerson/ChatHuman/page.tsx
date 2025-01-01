'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Videobox from '@/components/videobox';

export default function Chat() {
  const videoref = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const keys = '행복';
  const value = 30;

  const handleNavigation = () => {
    router.push('/Comment');
  };
  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox videoref={videoref} keys={keys} value={value} />
      </div>
      <div className={styles.right}>
        <Videobox videoref={videoref} keys={keys} value={value} />
        <button className={styles.endButton} onClick={handleNavigation}>
          대화 종료
        </button>
      </div>
    </div>
  );
}
