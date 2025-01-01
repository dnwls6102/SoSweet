import React from 'react';
import styles from './videobox.module.css';

interface VideoProps {
  keys: string;
  value: number;
  videoref: React.RefObject<HTMLVideoElement | null>;
}

export default function Videobox({ videoref, keys, value }: VideoProps) {
  return (
    <div className={styles.videobox}>
      <span className={styles.label}>
        {keys}: {value}%
      </span>
      <video ref={videoref}></video>
    </div>
  );
}
