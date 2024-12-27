'use client';

import React, { useRef } from 'react';
import styles from './page.module.css';
import Videobox from '@/components/videobox';

export default function Chat() {
  const videoref = useRef<HTMLVideoElement>(null);
  const keys = '호감도';
  const value = 10;

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox videoref={videoref} keys={keys} value={value} />
      </div>
      <div className={styles.right}>
        <textarea
          className={styles.textarea}
          readOnly
          defaultValue={`침울한 표정 1분 지속 : 호감도 - 10%\n주제 파악을 못함 : 호감도 - 10%`}
        ></textarea>
        <button className={styles.endButton}>대화 종료</button>
      </div>
    </div>
  );
}
