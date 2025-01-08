import React from 'react';
import styles from './videobox.module.css';

interface VideoProps {
  keys: string;
  value: number;
  videoref: React.RefObject<HTMLVideoElement | null>;
  autoplay?: boolean; // 선택적 prop
  playsinline?: boolean; // 선택적 prop
  muted?: boolean; // 선택적 prop
}

export default function Videobox({
  videoref,
  keys,
  value,
  autoplay = false,
  playsinline = false,
  muted = false,
}: VideoProps) {
  return (
    <div className={styles.videobox}>
      <span className={styles.label}>
        {String(keys)}: {value}%
      </span>
      <video
        ref={videoref}
        autoPlay={autoplay}
        playsInline={playsinline}
        muted={muted}
      ></video>
    </div>
  );
}
